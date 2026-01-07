"use client";

import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
  LogOut,
  Users,
} from "lucide-react";
import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import {
  CrosswordProvider,
  CrosswordProviderImperative,
  CrosswordGrid,
  CrosswordContext,
  Clue,
} from "@jaredreisinger/react-crossword";
import type { SerializedCrosswordPuzzle, TeamState } from "@/lib/daily-crossword/types";
import { useCrosswordWebSocket } from "@/hooks/useCrosswordWebSocket";
import { CursorOverlay } from "./CursorOverlay";

interface LibraryClueData {
  clue: string;
  answer: string;
  row: number;
  col: number;
}

interface LibraryCrosswordData {
  across: Record<string, LibraryClueData>;
  down: Record<string, LibraryClueData>;
}

interface RealtimeCrosswordProps {
  puzzle: SerializedCrosswordPuzzle;
  teamCode: string;
  initialTeamState: TeamState;
  sessionId: string;
  nickname: string;
  dateString: string;
  year: string;
  division: string;
  wsUrl: string;
  initialClue?: string | null; // Format: "1-across" or "2-down" - auto-select this clue on load
  onLeaveRoom?: () => void;
}

const CLUE_DELIMITER = "|||";

function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function convertToLibraryFormat(puzzle: SerializedCrosswordPuzzle): LibraryCrosswordData {
  const across: Record<string, LibraryClueData> = {};
  const down: Record<string, LibraryClueData> = {};

  for (const clue of puzzle.clues) {
    const clueData: LibraryClueData = {
      clue: `${capitalizeFirst(clue.text)}${CLUE_DELIMITER}${clue.bookTitle}${CLUE_DELIMITER}${clue.id}`,
      answer: clue.answer,
      row: clue.startRow,
      col: clue.startCol,
    };

    if (clue.direction === "across") {
      across[clue.number.toString()] = clueData;
    } else {
      down[clue.number.toString()] = clueData;
    }
  }

  return { across, down };
}

function CursorSync({
  sendCursor,
  lastSentCursorRef,
}: {
  sendCursor: (row: number, col: number, direction: "across" | "down") => void;
  lastSentCursorRef: React.MutableRefObject<string>;
}) {
  const { selectedPosition, selectedDirection } = useContext(CrosswordContext);

  useEffect(() => {
    if (selectedPosition.row < 0 || selectedPosition.col < 0) return;

    const cursorKey = `${selectedPosition.row},${selectedPosition.col},${selectedDirection}`;
    if (cursorKey === lastSentCursorRef.current) return;

    lastSentCursorRef.current = cursorKey;
    sendCursor(selectedPosition.row, selectedPosition.col, selectedDirection);
  }, [selectedPosition, selectedDirection, sendCursor, lastSentCursorRef]);

  return null;
}

function InitialClueSelector({
  initialClue,
  crosswordReady,
  onShowHelpModal,
}: {
  initialClue: string | null;
  crosswordReady: boolean;
  onShowHelpModal: (clueNumber: string, clueDirection: string) => void;
}) {
  const { handleClueSelected } = useContext(CrosswordContext);
  const hasSelected = useRef(false);

  useEffect(() => {
    if (!initialClue || !crosswordReady || hasSelected.current) return;

    // Parse the clue format: "1-across" or "2-down"
    const match = initialClue.match(/^(\d+)-(across|down)$/);
    if (!match) return;

    const [, number, direction] = match;
    hasSelected.current = true;

    // Small delay to ensure the crossword is fully rendered
    setTimeout(() => {
      handleClueSelected(direction as "across" | "down", number);
      onShowHelpModal(number, direction);
    }, 100);
  }, [initialClue, crosswordReady, handleClueSelected, onShowHelpModal]);

  return null;
}

function CollaborativeClue({
  direction,
  number,
  complete,
  correct,
  text,
  bookTitle,
  clueId,
  onHelpRequest,
}: {
  direction: "across" | "down";
  number: string;
  complete: boolean;
  correct: boolean;
  text: string;
  bookTitle: string;
  clueId: string;
  onHelpRequest: (clueId: string) => void;
}) {
  return (
    <div className="flex items-start gap-1 group">
      <Clue
        direction={direction}
        number={number}
        complete={complete}
        correct={correct}
      >
        {text} <em className="text-gray-500">({bookTitle})</em>
      </Clue>
      {!correct && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onHelpRequest(clueId);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
          title="Get help from a teammate"
        >
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}

function CustomDirectionClues({
  direction,
  label,
  correctClues,
  onHelpRequest,
}: {
  direction: "across" | "down";
  label: string;
  correctClues: string[];
  onHelpRequest: (clueId: string) => void;
}) {
  const { clues } = useContext(CrosswordContext);

  if (!clues) return null;

  return (
    <div className="direction space-y-2">
      <h3 className="text-lg font-bold text-gray-900 border-b pb-1 mb-3">{label}</h3>
      {clues[direction].map(({ number, clue, complete }) => {
        const [text, bookTitle, clueId] = clue.split(CLUE_DELIMITER);
        const isCorrect = correctClues.includes(clueId);
        return (
          <CollaborativeClue
            key={number}
            direction={direction}
            number={number}
            complete={complete ?? false}
            correct={isCorrect}
            text={text}
            bookTitle={bookTitle}
            clueId={clueId}
            onHelpRequest={onHelpRequest}
          />
        );
      })}
    </div>
  );
}

export default function RealtimeCrossword({
  puzzle,
  teamCode,
  initialTeamState,
  sessionId,
  nickname,
  dateString,
  year,
  division,
  wsUrl,
  initialClue,
  onLeaveRoom,
}: RealtimeCrosswordProps) {
  const posthog = usePostHog();
  const { width, height } = useWindowSize();
  const crosswordRef = useRef<CrosswordProviderImperative>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const isApplyingRemoteRef = useRef(false);
  const lastSentCursorRef = useRef<string>("");

  // Queue for processing remote updates sequentially to avoid dropped letters
  const remoteUpdateQueue = useRef<Array<{ row: number; col: number; letter: string }>>([]);
  const isProcessingQueue = useRef(false);

  const processRemoteUpdateQueue = useCallback(() => {
    if (isProcessingQueue.current || remoteUpdateQueue.current.length === 0) return;
    if (!crosswordRef.current) return;

    isProcessingQueue.current = true;
    isApplyingRemoteRef.current = true;

    const update = remoteUpdateQueue.current.shift()!;
    try {
      crosswordRef.current.setGuess(update.row, update.col, update.letter);
    } catch (err) {
      console.warn(`Failed to set remote guess at ${update.row},${update.col}:`, err);
    }

    // Process next update after a small delay to let the component settle
    requestAnimationFrame(() => {
      isProcessingQueue.current = false;
      isApplyingRemoteRef.current = remoteUpdateQueue.current.length > 0;
      processRemoteUpdateQueue();
    });
  }, []);

  const queueRemoteUpdate = useCallback((row: number, col: number, letter: string) => {
    remoteUpdateQueue.current.push({ row, col, letter });
    processRemoteUpdateQueue();
  }, [processRemoteUpdateQueue]);

  const [libraryData] = useState<LibraryCrosswordData>(() =>
    convertToLibraryFormat(puzzle)
  );
  const [correctClues, setCorrectClues] = useState<string[]>(
    initialTeamState.correctClues
  );
  const [completed, setCompleted] = useState(initialTeamState.completedAt !== null);
  const [completedAt, setCompletedAt] = useState(initialTeamState.completedAt);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(initialTeamState.startedAt);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [crosswordReady, setCrosswordReady] = useState(false);

  // Fallback to set crosswordReady after a delay if onLoadedCorrect doesn't fire
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!crosswordReady) {
        setCrosswordReady(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [crosswordReady]);

  const [helpModal, setHelpModal] = useState<{
    open: boolean;
    clueId: string | null;
    shareUrl: string | null;
    copied: boolean;
  }>({ open: false, clueId: null, shareUrl: null, copied: false });

  const [helpRequestModal, setHelpRequestModal] = useState<{
    open: boolean;
    clueNumber: string;
    clueDirection: string;
    clueText: string;
  } | null>(null);

  const [codeCopied, setCodeCopied] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Callback when user arrives via help link
  const handleShowHelpRequestModal = useCallback((clueNumber: string, clueDirection: string) => {
    // Find the clue text from the puzzle
    const clueData = libraryData[clueDirection as "across" | "down"]?.[clueNumber];
    // Clue text may contain delimiter - extract just the question part
    const rawClue = clueData?.clue || "";
    const clueText = rawClue.split(CLUE_DELIMITER)[0];
    
    setHelpRequestModal({
      open: true,
      clueNumber,
      clueDirection,
      clueText,
    });
  }, [libraryData]);

  // WebSocket connection
  const {
    isConnected,
    isConnecting,
    players,
    myColor,
    gameState,
    sendLetter,
    sendDelete,
    sendCursor,
  } = useCrosswordWebSocket({
    wsUrl,
    teamCode,
    sessionId,
    nickname,
    year,
    division,
    puzzleDate: dateString,
    onLetterUpdate: useCallback(
      (row: number, col: number, letter: string, fromSessionId: string) => {
        if (fromSessionId === sessionId) return;
        queueRemoteUpdate(row, col, letter);
      },
      [sessionId, queueRemoteUpdate]
    ),
    onDeleteUpdate: useCallback(
      (row: number, col: number, fromSessionId: string) => {
        if (fromSessionId === sessionId) return;
        queueRemoteUpdate(row, col, "");
      },
      [sessionId, queueRemoteUpdate]
    ),
    onCorrectClue: useCallback((clueId: string) => {
      setCorrectClues((prev) => {
        if (prev.includes(clueId)) return prev;
        return [...prev, clueId];
      });
    }, []),
    onComplete: useCallback(
      (completedAtTs: number, completionTimeMs: number) => {
        setCompleted(true);
        setCompletedAt(completedAtTs);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);

        track("dailyCrosswordComplete", {
          year,
          division,
          teamCode,
          completionTimeMs,
        });

        posthog?.capture("dailyCrosswordComplete", {
          year,
          division,
          teamCode,
          completionTimeMs,
        });
      },
      [year, division, teamCode, posthog]
    ),
  });

  // Update elapsed time
  useEffect(() => {
    if (completed) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, completed]);

  // Sync correct clues from WebSocket game state
  useEffect(() => {
    if (gameState?.correctClues) {
      setCorrectClues(gameState.correctClues);
    }
    if (gameState?.completedAt && !completed) {
      setCompleted(true);
      setCompletedAt(gameState.completedAt);
    }
  }, [gameState, completed]);

  // Track which answers we've applied to avoid re-applying
  const appliedAnswersRef = useRef<Record<string, string>>({});

  // Apply initial answers from initialTeamState when crossword is ready
  const hasAppliedInitialAnswers = useRef(false);
  useEffect(() => {
    if (!crosswordReady || !crosswordRef.current) return;
    if (hasAppliedInitialAnswers.current) return;

    hasAppliedInitialAnswers.current = true;
    const answers = initialTeamState.answers;
    if (!answers || Object.keys(answers).length === 0) return;

    isApplyingRemoteRef.current = true;

    Object.entries(answers).forEach(([cellKey, letter]) => {
      const [row, col] = cellKey.split(",").map(Number);
      try {
        crosswordRef.current?.setGuess(row, col, letter);
        appliedAnswersRef.current[cellKey] = letter;
      } catch (err) {
        console.warn(`Failed to set initial guess at ${row},${col}:`, err);
      }
    });

    setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 100);
  }, [crosswordReady, initialTeamState.answers]);

  // Apply answers from WebSocket gameState (handles case where DO has newer state than KV)
  useEffect(() => {
    if (!crosswordReady || !crosswordRef.current) return;
    if (!gameState?.answers) return;

    // Find answers that differ from what we've applied
    const newAnswers: Array<{ row: number; col: number; letter: string }> = [];
    Object.entries(gameState.answers).forEach(([cellKey, letter]) => {
      if (appliedAnswersRef.current[cellKey] !== letter) {
        const [row, col] = cellKey.split(",").map(Number);
        newAnswers.push({ row, col, letter });
        appliedAnswersRef.current[cellKey] = letter;
      }
    });

    if (newAnswers.length === 0) return;

    // Queue these as remote updates
    newAnswers.forEach(({ row, col, letter }) => {
      queueRemoteUpdate(row, col, letter);
    });
  }, [crosswordReady, gameState?.answers, queueRemoteUpdate]);

  // Handle cell changes
  const handleCellChange = useCallback(
    (row: number, col: number, char: string) => {
      if (isApplyingRemoteRef.current) return;

      if (char) {
        sendLetter(row, col, char.toUpperCase());
      } else {
        sendDelete(row, col);
      }
    },
    [sendLetter, sendDelete]
  );

  const handleHelpRequest = async (clueId: string) => {
    try {
      const response = await fetch("/api/daily-crossword/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          teamCode, 
          clueId,
          year,
          division,
          puzzleDate: dateString,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setHelpModal({
          open: true,
          clueId,
          shareUrl: data.shareUrl,
          copied: false,
        });
      }
    } catch (err) {
      console.error("Failed to create help request:", err);
    }
  };

  const handleCopyHelpUrl = async () => {
    if (helpModal.shareUrl) {
      await navigator.clipboard.writeText(helpModal.shareUrl);
      setHelpModal((prev) => ({ ...prev, copied: true }));
      setTimeout(() => setHelpModal((prev) => ({ ...prev, copied: false })), 2000);
    }
  };

  const getInviteLink = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/crossword/${year}/${division}?team=${teamCode}`;
  };

  const handleCopyTeamCode = async () => {
    await navigator.clipboard.writeText(teamCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleCopyInviteLink = async () => {
    await navigator.clipboard.writeText(getInviteLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const formatTime = (ms: number) => {
    const totalMinutes = Math.floor(ms / 1000 / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const crosswordTheme = {
    gridBackground: "#000000",
    cellBackground: "#ffffff",
    cellBorder: "#000000",
    textColor: "#000000",
    numberColor: "#000000",
    focusBackground: "#a8d8ff",
    highlightBackground: "#d4e9ff",
    columnBreakpoint: "9999px",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showConfetti && <Confetti width={width} height={height} recycle={false} />}

      {/* Header - sticky on desktop only */}
      <div className="bg-white border-b shadow-sm lg:sticky lg:top-0 z-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2">
          {/* Two-row grid for alignment */}
          <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 items-center">
            {/* Row 1 Left: Title + date */}
            <div className="flex items-baseline gap-2 min-w-0">
              <h1 className="text-base sm:text-lg font-bold font-serif leading-tight">Daily Crossword</h1>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(dateString + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            {/* Row 1 Right: Invite button */}
            <button
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors text-sm h-7"
              title="Invite friends to play"
            >
              <Users className="h-3.5 w-3.5 text-muted-foreground sm:hidden" />
              <span className="text-muted-foreground text-xs hidden sm:inline">Invite friends:</span>
              <span className="font-mono font-bold text-sm">{teamCode}</span>
            </button>

            {/* Row 2 Left: Team members (scrollable) */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide min-w-0 h-6">
              {/* Current user */}
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium border whitespace-nowrap flex-shrink-0"
                style={{ 
                  backgroundColor: `${myColor}12`, 
                  color: myColor,
                  borderColor: `${myColor}40`,
                }}
                title={`You are ${nickname}`}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: myColor }}
                />
                <span>{nickname}</span>
                <span className="opacity-50">(you)</span>
              </div>
              {/* Other players */}
              {Array.from(players.values()).map((player) => (
                <div
                  key={player.sessionId}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] whitespace-nowrap flex-shrink-0"
                  style={{
                    backgroundColor: `${player.color}12`,
                    color: player.color,
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span>{player.nickname}</span>
                </div>
              ))}
            </div>

            {/* Row 2 Right: Stats row */}
            <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground h-6">
              <span className="tabular-nums">
                <span className="font-semibold text-green-600">{correctClues.length}</span>
                <span className="opacity-60 mx-0.5">/</span>
                <span>{puzzle.clues.length}</span>
              </span>
              <div className="w-px h-3 bg-gray-200" />
              {isConnected ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : isConnecting ? (
                <Wifi className="h-3 w-3 text-yellow-500 animate-pulse" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span className="font-mono tabular-nums text-[11px]">
                {completed && completedAt
                  ? formatTime(completedAt - startTime)
                  : formatTime(elapsedTime)}
              </span>
              {onLeaveRoom && (
                <button
                  onClick={() => setLeaveModalOpen(true)}
                  className="hover:text-gray-900 transition-colors p-0.5 -mr-0.5"
                  title="Leave room"
                >
                  <LogOut className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Completed banner */}
      {completed && (
        <div className="bg-green-50 border-b border-green-200 py-4 text-center">
          <h2 className="text-2xl font-bold text-green-800">Puzzle Complete!</h2>
          <p className="text-green-700">
            Great teamwork! Completed in {formatTime((completedAt || Date.now()) - startTime)}
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto sm:p-4">
        <CrosswordProvider
          ref={crosswordRef}
          data={libraryData}
          theme={crosswordTheme}
          onCellChange={handleCellChange}
          onLoadedCorrect={() => setCrosswordReady(true)}
        >
          <CursorSync sendCursor={sendCursor} lastSentCursorRef={lastSentCursorRef} />
          {initialClue && (
            <InitialClueSelector 
              initialClue={initialClue} 
              crosswordReady={crosswordReady} 
              onShowHelpModal={handleShowHelpRequestModal}
            />
          )}
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Crossword grid with cursor overlay - sticky on all screens */}
            <div className="flex-shrink-0 sticky top-0 md:top-[140px] self-start bg-gray-50 pb-2 z-10 w-full md:w-[500px]">
              <div
                ref={gridContainerRef}
                className="border-2 border-gray-900 bg-white relative sm:mx-auto"
              >
                <CrosswordGrid />
                <CursorOverlay
                  players={players}
                  gridRef={gridContainerRef}
                  gridRows={puzzle.rows}
                  gridCols={puzzle.cols}
                />
              </div>
            </div>

            {/* Clues */}
            <div className="md:w-[28rem] xl:w-auto xl:flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4 px-4 sm:px-0">
              <div className="bg-white border rounded-lg p-4">
                <CustomDirectionClues
                  direction="across"
                  label="Across"
                  correctClues={correctClues}
                  onHelpRequest={handleHelpRequest}
                />
              </div>
              <div className="bg-white border rounded-lg p-4">
                <CustomDirectionClues
                  direction="down"
                  label="Down"
                  correctClues={correctClues}
                  onHelpRequest={handleHelpRequest}
                />
              </div>
            </div>
          </div>
        </CrosswordProvider>
      </div>

      {/* Invite friends modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Invite Friends to Play</h3>
              <button
                onClick={() => setInviteModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-muted-foreground">
              Solve this crossword together! Share the code or link below with friends to invite them to your game.
            </p>

            {/* Team code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Team Code</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-50 border rounded-lg text-center">
                  <span className="font-mono font-bold text-2xl tracking-wider">{teamCode}</span>
                </div>
                <Button onClick={handleCopyTeamCode} variant="outline" size="icon">
                  {codeCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Friends can enter this code at the crossword page to join your game.
              </p>
            </div>

            {/* Invite link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Or share a direct link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getInviteLink()}
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono truncate"
                />
                <Button onClick={handleCopyInviteLink} variant="outline" size="icon">
                  {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button className="w-full" onClick={() => setInviteModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Leave room confirmation modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Leave This Room?</h3>
              <button
                onClick={() => setLeaveModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-muted-foreground">
              You&apos;re about to leave this crossword room. You can rejoin anytime using the code below.
            </p>

            {/* Room code to save */}
            <div className="flex items-center justify-center gap-2 py-3 bg-gray-50 border rounded-lg">
              <span className="font-mono font-bold text-xl tracking-wider">{teamCode}</span>
              <button
                onClick={handleCopyTeamCode}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="Copy code"
              >
                {codeCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
              </button>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setLeaveModalOpen(false)}
              >
                Stay
              </Button>
              <Button 
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setLeaveModalOpen(false);
                  onLeaveRoom?.();
                }}
              >
                Leave Room
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Help request received modal - shown when arriving via help link */}
      {helpRequestModal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                Teammate Needs Help!
              </h3>
              <button
                onClick={() => setHelpRequestModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-muted-foreground">
              A teammate asked for help with this clue:
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="font-bold text-blue-900">
                {helpRequestModal.clueNumber} {helpRequestModal.clueDirection.toUpperCase()}
              </div>
              <div className="text-blue-800 mt-1">
                {helpRequestModal.clueText}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              If you know the answer, fill it out and then help answer the remaining questions!
            </p>

            <Button className="w-full" onClick={() => setHelpRequestModal(null)}>
              Got it!
            </Button>
          </div>
        </div>
      )}

      {/* Help modal */}
      {helpModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Get Help from a Teammate</h3>
              <button
                onClick={() =>
                  setHelpModal({ open: false, clueId: null, shareUrl: null, copied: false })
                }
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-muted-foreground">
              Share this link with a teammate who can look up the answer in the book!
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={helpModal.shareUrl || ""}
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono"
              />
              <Button onClick={handleCopyHelpUrl} variant="outline">
                {helpModal.copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleCopyHelpUrl}>
                {helpModal.copied ? "Copied!" : "Copy Link"}
              </Button>
              {helpModal.shareUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(helpModal.shareUrl!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tip: Text this link to your teammate!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
