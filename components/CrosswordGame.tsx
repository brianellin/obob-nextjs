"use client";

import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Book, Books } from "@/types";
import Image from "next/image";
import {
  ArrowRight,
  PawPrint,
  Loader2,
  Grid3X3,
  AlertCircle,
} from "lucide-react";
import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { WavyUnderline } from "./WavyUnderline";
import {
  CrosswordProvider,
  CrosswordProviderImperative,
  CrosswordGrid,
  CrosswordContext,
  Clue,
} from "@jaredreisinger/react-crossword";
import type {
  GamePhase,
  PuzzleSize,
  CrosswordPuzzle,
  CrosswordClue,
} from "@/lib/crossword/types";
import { PUZZLE_SIZE_CONFIG } from "@/lib/crossword/types";

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

type CrosswordGameProps = {
  books: Book[];
  year: string;
  division: string;
  onExit: () => void;
};

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert our puzzle format to the library's expected format
 * We use a delimiter to separate clue text from book title for custom rendering
 */
const CLUE_DELIMITER = "|||";

function convertToLibraryFormat(puzzle: CrosswordPuzzle): LibraryCrosswordData {
  const across: Record<string, LibraryClueData> = {};
  const down: Record<string, LibraryClueData> = {};

  for (const clue of puzzle.clues) {
    // Store text and book title with delimiter for custom parsing
    const clueData: LibraryClueData = {
      clue: `${capitalizeFirst(clue.text)}${CLUE_DELIMITER}${clue.bookTitle}`,
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
 * Custom DirectionClues component that renders book titles in italics
 */
function CustomDirectionClues({
  direction,
  label,
}: {
  direction: "across" | "down";
  label: string;
}) {
  const { clues } = useContext(CrosswordContext);

  if (!clues) return null;

  return (
    <div className="direction">
      <h3 className="header">{label}</h3>
      {clues[direction].map(({ number, clue, complete, correct }) => {
        // Parse the clue text and book title
        const [text, bookTitle] = clue.split(CLUE_DELIMITER);
        return (
          <Clue
            key={number}
            direction={direction}
            number={number}
            complete={complete}
            correct={correct}
          >
            {text} <em className="text-gray-500">({bookTitle})</em>
          </Clue>
        );
      })}
    </div>
  );
}

export default function CrosswordGame({
  books,
  year,
  division,
  onExit,
}: CrosswordGameProps) {
  const posthog = usePostHog();
  const { width, height } = useWindowSize();
  const crosswordRef = useRef<CrosswordProviderImperative>(null);

  // Game state
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup state
  const [allBooks, setAllBooks] = useState<Books>({});
  const [selectedBookKeys, setSelectedBookKeys] = useState<string[]>([]);
  const [puzzleSize, setPuzzleSize] = useState<PuzzleSize>("medium");
  const [selectAll, setSelectAll] = useState(false);

  // Playing state
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [libraryData, setLibraryData] = useState<LibraryCrosswordData | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Load books
  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await fetch(`/obob/${year}/${division}/books.json`);
        const data = await response.json();
        setAllBooks(data.books);
        // Select all books by default
        setSelectedBookKeys(Object.keys(data.books));
        setSelectAll(true);
      } catch (err) {
        console.error("Error loading books:", err);
        setError("Failed to load books");
      }
    };
    loadBooks();
  }, [year, division]);

  // Book selection handlers
  const handleToggleBook = (bookKey: string) => {
    setSelectedBookKeys((prev) =>
      prev.includes(bookKey)
        ? prev.filter((key) => key !== bookKey)
        : [...prev, bookKey]
    );
  };

  const handleToggleAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedBookKeys(Object.keys(allBooks));
    } else {
      setSelectedBookKeys([]);
    }
  };

  // Generate puzzle
  const handleGeneratePuzzle = async () => {
    setLoading(true);
    setError(null);

    try {
      const selectedBooks = selectedBookKeys.map((key) => ({
        ...allBooks[key],
        book_key: key,
      }));

      const response = await fetch("/api/questions/crossword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedBooks,
          puzzleSize,
          year,
          division,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to generate puzzle");
        setLoading(false);
        return;
      }

      // Convert cellNumbers back to Map
      const puzzleData: CrosswordPuzzle = {
        ...data.puzzle,
        cellNumbers: new Map(Object.entries(data.puzzle.cellNumbers).map(
          ([k, v]) => [k, v as number]
        )),
      };

      // Convert to library format
      const libData = convertToLibraryFormat(puzzleData);

      setPuzzle(puzzleData);
      setLibraryData(libData);
      setCorrectCount(0);
      setStartTime(Date.now());
      setEndTime(null);
      setIsComplete(false);
      setPhase("playing");

      // Track analytics
      track("crosswordStart", {
        year,
        division,
        puzzleSize,
        bookCount: selectedBooks.length,
        wordCount: puzzleData.clues.length,
      });

      posthog?.capture("crosswordStart", {
        year,
        division,
        puzzleSize,
        bookCount: selectedBooks.length,
        wordCount: puzzleData.clues.length,
      });
    } catch (err) {
      console.error("Error generating puzzle:", err);
      setError("Failed to generate puzzle. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle when a clue is answered correctly
  const handleAnswerCorrect = useCallback((direction: string, number: string, answer: string) => {
    setCorrectCount((prev) => prev + 1);
  }, []);

  // Handle crossword completion
  const handleCrosswordComplete = useCallback((correct: boolean) => {
    if (correct && puzzle && startTime && !isComplete) {
      setIsComplete(true);
      const end = Date.now();
      setEndTime(end);
      setPhase("results");

      const timeSeconds = Math.floor((end - startTime) / 1000);

      // Show confetti on completion
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      // Track completion
      track("crosswordComplete", {
        year,
        division,
        puzzleSize,
        timeSeconds,
        correctCount: puzzle.clues.length,
        totalCount: puzzle.clues.length,
      });

      posthog?.capture("crosswordComplete", {
        year,
        division,
        puzzleSize,
        timeSeconds,
        correctCount: puzzle.clues.length,
        totalCount: puzzle.clues.length,
      });
    }
  }, [puzzle, startTime, year, division, puzzleSize, posthog, isComplete]);


  // Reset puzzle
  const handleReset = useCallback(() => {
    if (crosswordRef.current) {
      crosswordRef.current.reset();
      setCorrectCount(0);
    }
  }, []);

  // New puzzle
  const handleNewPuzzle = () => {
    setPhase("setup");
    setPuzzle(null);
    setLibraryData(null);
  };

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Classic newspaper crossword theme
  const crosswordTheme = {
    gridBackground: "#000000",
    cellBackground: "#ffffff",
    cellBorder: "#000000",
    textColor: "#000000",
    numberColor: "#000000",
    focusBackground: "#a8d8ff",
    highlightBackground: "#d4e9ff",
    columnBreakpoint: "9999px", // Always show clues below on this layout
  };

  // Render setup phase
  if (phase === "setup") {
    return (
      <div className="min-h-screen pb-20 md:pb-0 relative">
        <Card className="w-full max-w-6xl mx-auto border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              <WavyUnderline style={0} thickness={4} color="text-amber-400">
                Content Crossword
              </WavyUnderline>
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">
              Solve crossword puzzles using content questions from your books
            </p>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {/* Book selection */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              <div className="col-span-full flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Select your books</h2>
                <Button
                  onClick={handleToggleAll}
                  variant="outline"
                  size="sm"
                  className="w-32"
                >
                  {selectAll ? "Clear" : "Select All"}
                </Button>
              </div>
              {Object.entries(allBooks).map(([key, book]) => (
                <div key={key} className="flex flex-col items-center">
                  <div
                    className={`relative w-20 h-28 cursor-pointer transition-all duration-200 rounded-md overflow-hidden ${
                      selectedBookKeys.includes(key)
                        ? "ring-4 ring-amber-500"
                        : ""
                    }`}
                    onClick={() => handleToggleBook(key)}
                  >
                    <Image
                      src={book.cover}
                      alt={book.title}
                      fill
                      style={{ objectFit: "cover" }}
                      className="rounded-md shadow-sm"
                      priority={true}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <p className="text-white text-center text-xs p-1">
                        {book.author}
                      </p>
                    </div>
                    {selectedBookKeys.includes(key) && (
                      <div className="absolute inset-0 bg-amber-500 bg-opacity-30 flex items-center justify-center">
                        <PawPrint className="text-white w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-medium text-center line-clamp-2 w-20">
                    {book.title}
                  </p>
                </div>
              ))}
            </div>

            {/* Puzzle size selection */}
            <div className="bg-amber-50 p-4 rounded-md mt-6 md:mt-8 md:max-w-lg md:mx-auto">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-row items-center justify-between w-full">
                  <p className="text-sm font-bold">Puzzle size</p>
                  <ToggleGroup
                    type="single"
                    value={puzzleSize}
                    onValueChange={(value: PuzzleSize) => {
                      if (value) setPuzzleSize(value);
                    }}
                    className="justify-center"
                  >
                    <ToggleGroupItem
                      value="small"
                      aria-label="Small puzzle"
                      className="data-[state=on]:bg-amber-500 data-[state=on]:text-white"
                    >
                      Small
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="medium"
                      aria-label="Medium puzzle"
                      className="data-[state=on]:bg-amber-500 data-[state=on]:text-white"
                    >
                      Medium
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="large"
                      aria-label="Large puzzle"
                      className="data-[state=on]:bg-amber-500 data-[state=on]:text-white"
                    >
                      Large
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {PUZZLE_SIZE_CONFIG[puzzleSize].label}
                </p>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 max-w-lg mx-auto">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate button */}
        <div className="p-4 flex justify-center">
          <Button
            onClick={handleGeneratePuzzle}
            disabled={loading || selectedBookKeys.length < 2}
            className="w-auto px-8 py-6 text-lg font-semibold group bg-amber-500 hover:bg-amber-600 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Grid3X3 className="mr-2 h-5 w-5" />
                Generate Puzzle
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
        {selectedBookKeys.length < 2 && (
          <p className="text-center text-sm text-gray-500">
            Select at least 2 books to generate a puzzle
          </p>
        )}
      </div>
    );
  }

  // Render playing phase
  if (phase === "playing" && puzzle && libraryData) {
    return (
      <div className="min-h-screen bg-stone-100">
        {/* Newspaper-style header */}
        <div className="bg-white border-b-2 border-black px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={onExit}
              className="font-serif text-sm text-gray-600 hover:text-black transition-colors"
            >
              ← Exit
            </button>
            <div className="text-center">
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
                The Daily Crossword
              </h1>
              <p className="font-serif text-xs text-gray-500 italic">
                Oregon Battle of the Books Edition
              </p>
            </div>
            <button
              onClick={handleNewPuzzle}
              className="font-serif text-sm text-gray-600 hover:text-black transition-colors"
            >
              New Puzzle
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-white border-b border-gray-300 px-4 py-2">
          <div className="max-w-4xl mx-auto flex justify-center gap-8 font-serif text-sm">
            <span className="text-gray-600">
              <span className="font-semibold text-black">{correctCount}</span> of {puzzle.clues.length} words
            </span>
            {startTime && (
              <span className="text-gray-600">
                Time: <span className="font-semibold text-black font-mono">{formatTime(Date.now() - startTime)}</span>
              </span>
            )}
          </div>
        </div>

        {/* Crossword with custom layout */}
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          <style jsx global>{`
            /* Classic newspaper crossword styling */
            .crossword-container {
              font-family: 'Times New Roman', Georgia, serif !important;
            }

            /* Grid styling - thicker borders, solid black background */
            .crossword-container svg {
              border: 2px solid #000 !important;
            }
            .crossword-container svg rect {
              stroke: #000 !important;
              stroke-width: 1px !important;
            }
            .crossword-container svg text {
              font-family: 'Times New Roman', Georgia, serif !important;
              font-weight: 500 !important;
            }

            /* Clue number styling - keep default positioning, just adjust font */
            .crossword-container svg text[text-anchor="start"] {
              font-family: Arial, sans-serif !important;
              font-weight: 600 !important;
            }

            /* Section headers */
            .crossword-container h3 {
              font-family: 'Times New Roman', Georgia, serif !important;
              font-weight: bold !important;
              text-transform: uppercase !important;
              letter-spacing: 0.15em !important;
              font-size: 0.8rem !important;
              border-bottom: 2px solid #000 !important;
              padding-bottom: 0.5rem !important;
              margin-bottom: 0.75rem !important;
            }

            /* Clue text styling */
            .crossword-container div[class*="clue"],
            .crossword-container [class*="Clue"] {
              font-family: 'Times New Roman', Georgia, serif !important;
              font-size: 0.9rem !important;
              line-height: 1.4 !important;
              padding: 0.3rem 0 !important;
              border-bottom: 1px solid #e5e5e5 !important;
              cursor: pointer !important;
            }

            /* Highlighted/selected clue */
            .crossword-container div[class*="clue"][style*="background"],
            .crossword-container [class*="Clue"][style*="background"] {
              background-color: #d4e9ff !important;
              margin: 0 -0.5rem !important;
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
            }
          `}</style>

          <CrosswordProvider
            ref={crosswordRef}
            data={libraryData}
            theme={crosswordTheme}
            onAnswerCorrect={handleAnswerCorrect}
            onCrosswordCorrect={handleCrosswordComplete}
            useStorage={false}
          >
            <div className="crossword-container">
              {/* Desktop: side-by-side layout, Mobile: stacked */}
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Grid section - fixed size container for the SVG */}
                <div className="bg-white p-4 sm:p-6 shadow-lg border-2 border-black flex-shrink-0">
                  <div className="w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[450px] lg:h-[450px]">
                    <CrosswordGrid />
                  </div>
                </div>

                {/* Clues section */}
                <div className="bg-white p-4 sm:p-6 shadow-lg border border-gray-200 flex-1 min-w-0 max-h-[500px] lg:max-h-[520px] overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                    <div>
                      <CustomDirectionClues direction="across" label="ACROSS" />
                    </div>
                    <div>
                      <CustomDirectionClues direction="down" label="DOWN" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CrosswordProvider>
        </div>

      </div>
    );
  }

  // Render results phase
  if (phase === "results" && puzzle) {
    const timeMs = endTime && startTime ? endTime - startTime : 0;
    const totalCount = puzzle.clues.length;

    // Group clues by book
    const cluesByBook = puzzle.clues.reduce((acc, clue) => {
      if (!acc[clue.bookTitle]) {
        acc[clue.bookTitle] = [];
      }
      acc[clue.bookTitle].push(clue);
      return acc;
    }, {} as Record<string, CrosswordClue[]>);

    return (
      <div className="min-h-screen bg-stone-100">
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
          />
        )}

        {/* Newspaper-style header */}
        <div className="bg-white border-b-2 border-black px-4 py-3">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
              The Daily Crossword
            </h1>
            <p className="font-serif text-xs text-gray-500 italic">
              Oregon Battle of the Books Edition
            </p>
          </div>
        </div>

        {/* Completion banner */}
        <div className="bg-white border-b border-gray-300 px-4 py-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="font-serif text-2xl sm:text-3xl font-bold italic">
              Puzzle Complete!
            </p>
            <div className="flex justify-center gap-8 mt-3 font-serif text-sm">
              <span className="text-gray-600">
                Words: <span className="font-semibold text-black">{totalCount}/{totalCount}</span>
              </span>
              <span className="text-gray-600">
                Time: <span className="font-semibold text-black font-mono">{formatTime(timeMs)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Answers panel */}
        <div className="max-w-2xl mx-auto p-4 sm:p-6">
          <div className="bg-white p-6 shadow-md border border-gray-200">
            <h2 className="font-serif text-lg font-bold uppercase tracking-wider border-b border-black pb-2 mb-4">
              Solution
            </h2>
            <div className="space-y-4 font-serif text-sm max-h-80 lg:max-h-[400px] overflow-y-auto">
              {Object.entries(cluesByBook).map(([bookTitle, clues]) => (
                <div key={bookTitle}>
                  <p className="font-bold text-gray-800 mb-2 italic">{bookTitle}</p>
                  <div className="space-y-2 pl-3 border-l-2 border-gray-200">
                    {clues.map((clue) => (
                      <div key={clue.id}>
                        <div className="flex gap-2 items-baseline">
                          <span className="text-gray-500 flex-shrink-0 text-xs font-mono">
                            {clue.number}{clue.direction === "across" ? "A" : "D"}
                          </span>
                          <span className="text-black font-bold uppercase tracking-wide">
                            {clue.answer}
                          </span>
                        </div>
                        <p className="text-gray-600 text-xs mt-0.5 pl-6 italic">
                          {clue.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-gray-300">
              <button
                onClick={handleNewPuzzle}
                className="w-full py-3 bg-black text-white font-serif font-semibold hover:bg-gray-800 transition-colors"
              >
                New Puzzle
              </button>
              <button
                onClick={onExit}
                className="w-full py-3 border border-black text-black font-serif hover:bg-gray-100 transition-colors"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    </div>
  );
}
