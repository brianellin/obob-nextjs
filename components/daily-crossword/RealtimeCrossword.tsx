"use client";

import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  Clock,
  HelpCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  Wifi,
  WifiOff,
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
    <div className="direction">
      <h3 className="header">{label}</h3>
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
}: RealtimeCrosswordProps) {
  const posthog = usePostHog();
  const { width, height } = useWindowSize();
  const crosswordRef = useRef<CrosswordProviderImperative>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const isApplyingRemoteRef = useRef(false);
  const lastSentCursorRef = useRef<string>("");

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

  const [helpModal, setHelpModal] = useState<{
    open: boolean;
    clueId: string | null;
    shareUrl: string | null;
    copied: boolean;
  }>({ open: false, clueId: null, shareUrl: null, copied: false });

  const [codeCopied, setCodeCopied] = useState(false);

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
        if (!crosswordRef.current) return;

        isApplyingRemoteRef.current = true;
        try {
          crosswordRef.current.setGuess(row, col, letter);
        } catch (err) {
          console.warn(`Failed to set remote guess at ${row},${col}:`, err);
        }
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 50);
      },
      [sessionId]
    ),
    onDeleteUpdate: useCallback(
      (row: number, col: number, fromSessionId: string) => {
        if (fromSessionId === sessionId) return;
        if (!crosswordRef.current) return;

        isApplyingRemoteRef.current = true;
        try {
          crosswordRef.current.setGuess(row, col, "");
        } catch (err) {
          console.warn(`Failed to clear remote cell at ${row},${col}:`, err);
        }
        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 50);
      },
      [sessionId]
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

  // Apply initial answers when crossword is ready
  useEffect(() => {
    if (!crosswordReady || !crosswordRef.current) return;

    const answers = gameState?.answers || initialTeamState.answers;
    if (!answers || Object.keys(answers).length === 0) return;

    isApplyingRemoteRef.current = true;

    Object.entries(answers).forEach(([cellKey, letter]) => {
      const [row, col] = cellKey.split(",").map(Number);
      try {
        crosswordRef.current?.setGuess(row, col, letter);
      } catch (err) {
        console.warn(`Failed to set initial guess at ${row},${col}:`, err);
      }
    });

    setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, 100);
  }, [crosswordReady, gameState?.answers, initialTeamState.answers]);

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

  // Track cursor/focus changes
  const handleCrosswordFocus = useCallback(
    (direction: "across" | "down", number: string) => {
      const clueData = libraryData[direction][number];
      if (!clueData) return;

      const cursorKey = `${clueData.row},${clueData.col},${direction}`;
      if (cursorKey === lastSentCursorRef.current) return;

      lastSentCursorRef.current = cursorKey;
      sendCursor(clueData.row, clueData.col, direction);
    },
    [libraryData, sendCursor]
  );

  const handleHelpRequest = async (clueId: string) => {
    try {
      const response = await fetch("/api/daily-crossword/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamCode, clueId }),
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

  const handleCopyTeamCode = async () => {
    await navigator.clipboard.writeText(teamCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
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

      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold font-serif">Daily Team Crossword</h1>
              <p className="text-sm text-muted-foreground">{dateString}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection status */}
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : isConnecting ? (
                  <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </div>

              {/* Team code */}
              <button
                onClick={handleCopyTeamCode}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <span className="font-mono font-bold">{teamCode}</span>
                {codeCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </button>

              {/* Team members */}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  {/* Current user */}
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-sm"
                    style={{ backgroundColor: `${myColor}20`, color: myColor }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: myColor }}
                    />
                    <span>{nickname}</span>
                  </div>
                  {/* Other players */}
                  {Array.from(players.values()).map((player) => (
                    <div
                      key={player.sessionId}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-sm"
                      style={{
                        backgroundColor: `${player.color}20`,
                        color: player.color,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: player.color }}
                      />
                      <span>{player.nickname}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1 text-sm font-mono text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {completed && completedAt
                    ? formatTime(completedAt - startTime)
                    : formatTime(elapsedTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{
                    width: `${(correctClues.length / puzzle.clues.length) * 100}%`,
                  }}
                />
              </div>
              <span className="font-medium">
                {correctClues.length}/{puzzle.clues.length}
              </span>
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
      <div className="max-w-6xl mx-auto p-4">
        <CrosswordProvider
          ref={crosswordRef}
          data={libraryData}
          theme={crosswordTheme}
          onCellChange={handleCellChange}
          onClueSelected={handleCrosswordFocus}
          onLoadedCorrect={() => setCrosswordReady(true)}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Crossword grid with cursor overlay */}
            <div className="flex-1">
              <div
                ref={gridContainerRef}
                className="border-2 border-gray-900 bg-white relative"
                style={{ maxWidth: "500px", margin: "0 auto" }}
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
            <div className="lg:w-96 space-y-4">
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
