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
import type { SerializedCrosswordPuzzle, TeamState, SyncResponse } from "@/lib/daily-crossword/types";
import type { CrosswordClue } from "@/lib/crossword/types";

// Type for the library's clue format
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

interface CollaborativeCrosswordProps {
  puzzle: SerializedCrosswordPuzzle;
  teamCode: string;
  initialTeamState: TeamState;
  sessionId: string;
  nickname: string;
  dateString: string;
  year: string;
  division: string;
  onExit: () => void;
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

/**
 * Custom clue component with help request button
 */
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

/**
 * Custom DirectionClues with help buttons
 */
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

export default function CollaborativeCrossword({
  puzzle,
  teamCode,
  initialTeamState,
  sessionId,
  nickname,
  dateString,
  year,
  division,
  onExit,
}: CollaborativeCrosswordProps) {
  const posthog = usePostHog();
  const { width, height } = useWindowSize();
  const crosswordRef = useRef<CrosswordProviderImperative>(null);
  const syncAbortRef = useRef<AbortController | null>(null);
  const isApplyingRemoteAnswersRef = useRef(false);
  const appliedAnswersRef = useRef<Set<string>>(new Set());
  const crosswordReadyRef = useRef(false);
  const [crosswordReady, setCrosswordReady] = useState(false);

  // State
  const [libraryData] = useState<LibraryCrosswordData>(() =>
    convertToLibraryFormat(puzzle)
  );
  const [correctClues, setCorrectClues] = useState<string[]>(
    initialTeamState.correctClues
  );
  const [members, setMembers] = useState(initialTeamState.members);
  const [completed, setCompleted] = useState(initialTeamState.completedAt !== null);
  const [completedAt, setCompletedAt] = useState(initialTeamState.completedAt);
  const [showConfetti, setShowConfetti] = useState(false);
  const [startTime] = useState(initialTeamState.startedAt);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Help request modal state
  const [helpModal, setHelpModal] = useState<{
    open: boolean;
    clueId: string | null;
    shareUrl: string | null;
    copied: boolean;
  }>({ open: false, clueId: null, shareUrl: null, copied: false });

  // Code copy state
  const [codeCopied, setCodeCopied] = useState(false);

  // Update elapsed time
  useEffect(() => {
    if (completed) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, completed]);

  // Keep ref in sync with state (for use in closures like sync loop)
  useEffect(() => {
    crosswordReadyRef.current = crosswordReady;
  }, [crosswordReady]);

  // Fallback to set crosswordReady after a delay if onLoadedCorrect doesn't fire
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!crosswordReady) {
        setCrosswordReady(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [crosswordReady]);

  // Apply initial answers from team state when crossword is ready
  useEffect(() => {
    if (!crosswordReady || !crosswordRef.current) return;

    const answers = initialTeamState.answers;
    if (!answers || Object.keys(answers).length === 0) return;

    // Mark that we're applying remote answers to prevent re-POSTing
    isApplyingRemoteAnswersRef.current = true;

    const entries = Object.entries(answers);
    let applied = 0;

    // Apply answers with a small delay between each to avoid overwhelming the library
    const applyNext = () => {
      if (applied >= entries.length) {
        // All done - reset flag after a delay for any pending callbacks
        setTimeout(() => {
          isApplyingRemoteAnswersRef.current = false;
        }, 100);
        return;
      }

      const [cellKey, letter] = entries[applied];
      const [row, col] = cellKey.split(",").map(Number);
      try {
        crosswordRef.current?.setGuess(row, col, letter);
        appliedAnswersRef.current.add(`${cellKey}:${letter}`);
      } catch (err) {
        console.warn(`Failed to set guess at ${row},${col}:`, err);
      }

      applied++;
      // Small delay between calls to let the library process each one
      if (applied < entries.length) {
        setTimeout(applyNext, 10);
      } else {
        // Last one - reset flag after delay
        setTimeout(() => {
          isApplyingRemoteAnswersRef.current = false;
        }, 100);
      }
    };

    applyNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crosswordReady]);

  // Long-polling sync
  useEffect(() => {
    let mounted = true;
    let lastUpdate = Date.now();

    const sync = async () => {
      while (mounted) {
        try {
          syncAbortRef.current = new AbortController();
          const response = await fetch(
            `/api/daily-crossword/team/${teamCode}/sync?lastUpdate=${lastUpdate}&sessionId=${sessionId}`,
            { signal: syncAbortRef.current.signal }
          );

          if (!response.ok) {
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }

          const data: SyncResponse = await response.json();

          if (mounted) {
            // Apply answers from server (only if crossword is ready)
            if (crosswordRef.current && data.answers && crosswordReadyRef.current) {
              isApplyingRemoteAnswersRef.current = true;
              Object.entries(data.answers).forEach(([cellKey, letter]) => {
                // Only apply if we haven't already set this cell with the same value
                if (!appliedAnswersRef.current.has(`${cellKey}:${letter}`)) {
                  const [row, col] = cellKey.split(",").map(Number);
                  try {
                    crosswordRef.current?.setGuess(row, col, letter);
                    appliedAnswersRef.current.add(`${cellKey}:${letter}`);
                  } catch (err) {
                    console.warn(`Failed to set guess at ${row},${col}:`, err);
                  }
                }
              });
              setTimeout(() => {
                isApplyingRemoteAnswersRef.current = false;
              }, 100);
            }

            setCorrectClues(data.correctClues);
            setMembers(data.members);
            lastUpdate = data.timestamp;

            if (data.completed && !completed) {
              setCompleted(true);
              setCompletedAt(data.completedAt);
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 5000);

              track("dailyCrosswordComplete", {
                year,
                division,
                teamCode,
                memberCount: Object.keys(data.members).length + 1,
              });

              posthog?.capture("dailyCrosswordComplete", {
                year,
                division,
                teamCode,
                memberCount: Object.keys(data.members).length + 1,
              });
            }
          }
        } catch (err) {
          if ((err as Error).name === "AbortError") {
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    };

    sync();

    return () => {
      mounted = false;
      syncAbortRef.current?.abort();
    };
  }, [teamCode, sessionId, completed, year, division, posthog]);

  // Handle letter input
  const handleCellChange = useCallback(
    async (row: number, col: number, char: string) => {
      // Skip POST if we're applying answers from the server (prevent feedback loop)
      if (isApplyingRemoteAnswersRef.current) {
        return;
      }

      // Track this answer locally so we don't re-apply it from sync
      const cellKey = `${row},${col}`;
      appliedAnswersRef.current.add(`${cellKey}:${char}`);

      try {
        await fetch(`/api/daily-crossword/team/${teamCode}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            row,
            col,
            letter: char,
          }),
        });
      } catch (err) {
        console.error("Failed to submit answer:", err);
      }
    },
    [teamCode, sessionId]
  );

  // Handle help request
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
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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

  const memberCount = Object.keys(members).length + 1; // +1 for self

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

              {/* Member count */}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{memberCount}</span>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1 text-sm font-mono">
                <Clock className="h-4 w-4" />
                <span>
                  {completed && completedAt
                    ? formatTime(completedAt - startTime)
                    : formatTime(elapsedTime)}
                </span>
              </div>

              <Button variant="outline" size="sm" onClick={onExit}>
                Exit
              </Button>
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
          onLoadedCorrect={() => setCrosswordReady(true)}
        >
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Crossword grid */}
            <div className="flex-1">
              <div
                className="border-2 border-gray-900 bg-white"
                style={{ maxWidth: "500px", margin: "0 auto" }}
              >
                <CrosswordGrid />
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

              {/* Team members */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>{nickname} (you)</span>
                  </div>
                  {Object.values(members).map((member) => (
                    <div key={member.sessionId} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>{member.nickname}</span>
                    </div>
                  ))}
                </div>
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
                onClick={() => setHelpModal({ open: false, clueId: null, shareUrl: null, copied: false })}
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
                {helpModal.copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
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
