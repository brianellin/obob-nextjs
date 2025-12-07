"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Book, Books } from "@/types";
import Image from "next/image";
import {
  ArrowRight,
  PawPrint,
  Home,
  RotateCcw,
  CheckCircle2,
  Eye,
  Loader2,
  Grid3X3,
  AlertCircle,
} from "lucide-react";
import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { WavyUnderline } from "./WavyUnderline";
import CrosswordGrid from "./CrosswordGrid";
import CrosswordClueList from "./CrosswordClueList";
import type {
  GamePhase,
  PuzzleSize,
  CrosswordPuzzle,
  CrosswordClue,
  Direction,
  UserAnswers,
} from "@/lib/crossword/types";
import { PUZZLE_SIZE_CONFIG } from "@/lib/crossword/types";
import { getClueCells, isClueCorrect, isClueFilled } from "@/lib/crossword/generator";

type CrosswordGameProps = {
  books: Book[];
  year: string;
  division: string;
  onExit: () => void;
};

export default function CrosswordGame({
  books,
  year,
  division,
  onExit,
}: CrosswordGameProps) {
  const posthog = usePostHog();
  const { width, height } = useWindowSize();

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
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<Direction>("across");
  const [correctCells, setCorrectCells] = useState<Set<string>>(new Set());
  const [incorrectCells, setIncorrectCells] = useState<Set<string>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [mobileClueTab, setMobileClueTab] = useState<"across" | "down">("across");

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

  // Get the currently selected clue based on selected cell
  const selectedClue = useMemo(() => {
    if (!selectedCell || !puzzle) return null;

    // Find clue that contains this cell and matches direction
    for (const clue of puzzle.clues) {
      if (clue.direction !== selectedDirection) continue;

      const cells = getClueCells(clue);
      for (const cell of cells) {
        if (cell.row === selectedCell.row && cell.col === selectedCell.col) {
          return clue;
        }
      }
    }

    // If no clue in current direction, try other direction
    for (const clue of puzzle.clues) {
      const cells = getClueCells(clue);
      for (const cell of cells) {
        if (cell.row === selectedCell.row && cell.col === selectedCell.col) {
          return clue;
        }
      }
    }

    return null;
  }, [selectedCell, selectedDirection, puzzle]);

  // Get completed and correct clue IDs
  const completedClueIds = useMemo(() => {
    if (!puzzle) return new Set<string>();
    const completed = new Set<string>();
    for (const clue of puzzle.clues) {
      if (isClueFilled(clue, userAnswers)) {
        completed.add(clue.id);
      }
    }
    return completed;
  }, [puzzle, userAnswers]);

  const correctClueIds = useMemo(() => {
    if (!puzzle) return new Set<string>();
    const correct = new Set<string>();
    for (const clue of puzzle.clues) {
      if (isClueCorrect(clue, userAnswers)) {
        correct.add(clue.id);
      }
    }
    return correct;
  }, [puzzle, userAnswers]);

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

      setPuzzle(puzzleData);
      setUserAnswers({});
      setSelectedCell(null);
      setCorrectCells(new Set());
      setIncorrectCells(new Set());
      setRevealedCells(new Set());
      setStartTime(Date.now());
      setEndTime(null);
      setHintsUsed(0);
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

  // Cell click handler
  const handleCellClick = useCallback((row: number, col: number) => {
    setSelectedCell((prev) => {
      // If clicking the same cell, toggle direction
      if (prev?.row === row && prev?.col === col) {
        setSelectedDirection((d) => (d === "across" ? "down" : "across"));
        return prev;
      }
      return { row, col };
    });
    // Clear check states when selecting new cell
    setCorrectCells(new Set());
    setIncorrectCells(new Set());
  }, []);

  // Letter input handler
  const handleLetterInput = useCallback((letter: string) => {
    if (!selectedCell || !puzzle) return;

    const cellKey = `${selectedCell.row},${selectedCell.col}`;

    // Don't allow input on black cells
    if (puzzle.grid[selectedCell.row]?.[selectedCell.col] === null) return;

    setUserAnswers((prev) => ({
      ...prev,
      [cellKey]: letter,
    }));

    // Advance to next cell in current direction
    const nextRow = selectedDirection === "down" ? selectedCell.row + 1 : selectedCell.row;
    const nextCol = selectedDirection === "across" ? selectedCell.col + 1 : selectedCell.col;

    // Check if next cell is valid (not black, within bounds)
    if (
      nextRow < puzzle.rows &&
      nextCol < puzzle.cols &&
      puzzle.grid[nextRow]?.[nextCol] !== null
    ) {
      setSelectedCell({ row: nextRow, col: nextCol });
    }
  }, [selectedCell, selectedDirection, puzzle]);

  // Backspace handler
  const handleBackspace = useCallback(() => {
    if (!selectedCell || !puzzle) return;

    const cellKey = `${selectedCell.row},${selectedCell.col}`;

    // If current cell is empty, move back first
    if (!userAnswers[cellKey]) {
      const prevRow = selectedDirection === "down" ? selectedCell.row - 1 : selectedCell.row;
      const prevCol = selectedDirection === "across" ? selectedCell.col - 1 : selectedCell.col;

      if (
        prevRow >= 0 &&
        prevCol >= 0 &&
        puzzle.grid[prevRow]?.[prevCol] !== null
      ) {
        setSelectedCell({ row: prevRow, col: prevCol });
        const prevCellKey = `${prevRow},${prevCol}`;
        setUserAnswers((prev) => {
          const next = { ...prev };
          delete next[prevCellKey];
          return next;
        });
      }
    } else {
      // Clear current cell
      setUserAnswers((prev) => {
        const next = { ...prev };
        delete next[cellKey];
        return next;
      });
    }
  }, [selectedCell, selectedDirection, puzzle, userAnswers]);

  // Navigate handler
  const handleNavigate = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (!selectedCell || !puzzle) return;

    let newRow = selectedCell.row;
    let newCol = selectedCell.col;

    switch (direction) {
      case "up":
        newRow = Math.max(0, selectedCell.row - 1);
        break;
      case "down":
        newRow = Math.min(puzzle.rows - 1, selectedCell.row + 1);
        break;
      case "left":
        newCol = Math.max(0, selectedCell.col - 1);
        break;
      case "right":
        newCol = Math.min(puzzle.cols - 1, selectedCell.col + 1);
        break;
    }

    // Skip black cells
    if (puzzle.grid[newRow]?.[newCol] !== null) {
      setSelectedCell({ row: newRow, col: newCol });
    }
  }, [selectedCell, puzzle]);

  // Direction toggle
  const handleDirectionToggle = useCallback(() => {
    setSelectedDirection((d) => (d === "across" ? "down" : "across"));
  }, []);

  // Next/prev word
  const handleNextWord = useCallback(() => {
    if (!puzzle || !selectedClue) return;

    const clues = puzzle.clues.filter((c) => c.direction === selectedDirection);
    const currentIndex = clues.findIndex((c) => c.id === selectedClue.id);
    const nextIndex = (currentIndex + 1) % clues.length;
    const nextClue = clues[nextIndex];

    setSelectedCell({ row: nextClue.startRow, col: nextClue.startCol });
  }, [puzzle, selectedClue, selectedDirection]);

  const handlePrevWord = useCallback(() => {
    if (!puzzle || !selectedClue) return;

    const clues = puzzle.clues.filter((c) => c.direction === selectedDirection);
    const currentIndex = clues.findIndex((c) => c.id === selectedClue.id);
    const prevIndex = (currentIndex - 1 + clues.length) % clues.length;
    const prevClue = clues[prevIndex];

    setSelectedCell({ row: prevClue.startRow, col: prevClue.startCol });
  }, [puzzle, selectedClue, selectedDirection]);

  // Clue click handler
  const handleClueClick = useCallback((clue: CrosswordClue) => {
    setSelectedCell({ row: clue.startRow, col: clue.startCol });
    setSelectedDirection(clue.direction);
    setMobileClueTab(clue.direction);
  }, []);

  // Check answers
  const handleCheckAnswers = useCallback(() => {
    if (!puzzle) return;

    const correct = new Set<string>();
    const incorrect = new Set<string>();

    for (const clue of puzzle.clues) {
      const cells = getClueCells(clue);
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const cellKey = `${cell.row},${cell.col}`;
        const userLetter = userAnswers[cellKey]?.toUpperCase() || "";
        const correctLetter = clue.answer[i];

        if (userLetter) {
          if (userLetter === correctLetter) {
            correct.add(cellKey);
          } else {
            incorrect.add(cellKey);
          }
        }
      }
    }

    setCorrectCells(correct);
    setIncorrectCells(incorrect);

    // Track check
    posthog?.capture("crosswordCheckAnswers", {
      year,
      division,
      correctCount: correct.size,
      incorrectCount: incorrect.size,
      totalFilled: Object.keys(userAnswers).length,
    });

    // Check if puzzle is complete and all correct
    if (correctClueIds.size === puzzle.clues.length) {
      handlePuzzleComplete();
    }
  }, [puzzle, userAnswers, correctClueIds, year, division, posthog]);

  // Reveal all
  const handleRevealAll = useCallback(() => {
    if (!puzzle) return;

    const newAnswers: UserAnswers = {};
    const revealed = new Set<string>();

    for (const clue of puzzle.clues) {
      const cells = getClueCells(clue);
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const cellKey = `${cell.row},${cell.col}`;
        newAnswers[cellKey] = clue.answer[i];
        revealed.add(cellKey);
      }
    }

    setUserAnswers(newAnswers);
    setRevealedCells(revealed);
    setHintsUsed((prev) => prev + puzzle.clues.length);
    setCorrectCells(new Set());
    setIncorrectCells(new Set());

    handlePuzzleComplete();
  }, [puzzle]);

  // Puzzle complete
  const handlePuzzleComplete = useCallback(() => {
    if (!puzzle || !startTime) return;

    const end = Date.now();
    setEndTime(end);
    setPhase("results");

    const timeSeconds = Math.floor((end - startTime) / 1000);
    const correctCount = correctClueIds.size;
    const totalCount = puzzle.clues.length;

    // Show confetti for perfect score without hints
    if (correctCount === totalCount && hintsUsed === 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }

    // Track completion
    track("crosswordComplete", {
      year,
      division,
      puzzleSize,
      timeSeconds,
      correctCount,
      totalCount,
      hintsUsed,
    });

    posthog?.capture("crosswordComplete", {
      year,
      division,
      puzzleSize,
      timeSeconds,
      correctCount,
      totalCount,
      hintsUsed,
    });
  }, [puzzle, startTime, correctClueIds, hintsUsed, year, division, puzzleSize, posthog]);

  // New puzzle
  const handleNewPuzzle = () => {
    setPhase("setup");
    setPuzzle(null);
  };

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
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
  if (phase === "playing" && puzzle) {
    const progress = Math.round((correctClueIds.size / puzzle.clues.length) * 100);

    return (
      <div className="min-h-screen p-2 sm:p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 lg:mb-6">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <Home className="w-4 h-4 mr-1" />
            Exit
          </Button>
          <div className="text-center">
            <p className="text-sm text-gray-500 lg:text-base">
              {correctClueIds.size} / {puzzle.clues.length} words
            </p>
            {startTime && (
              <p className="text-xs text-gray-400 lg:text-sm">
                {formatTime(Date.now() - startTime)}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleNewPuzzle}>
            <RotateCcw className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {/* Main content - different layouts for mobile/desktop */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-8">
          {/* Crossword grid - max 60% width on desktop */}
          <div className="flex justify-center lg:max-w-[60%] lg:flex-shrink-0 animate-puzzle-reveal">
            <CrosswordGrid
              grid={puzzle.grid}
              rows={puzzle.rows}
              cols={puzzle.cols}
              cellNumbers={Object.fromEntries(puzzle.cellNumbers)}
              clues={puzzle.clues}
              userAnswers={userAnswers}
              selectedCell={selectedCell}
              selectedDirection={selectedDirection}
              selectedClue={selectedClue}
              correctCells={correctCells}
              incorrectCells={incorrectCells}
              revealedCells={revealedCells}
              onCellClick={handleCellClick}
              onLetterInput={handleLetterInput}
              onBackspace={handleBackspace}
              onNavigate={handleNavigate}
              onDirectionToggle={handleDirectionToggle}
              onNextWord={handleNextWord}
              onPrevWord={handlePrevWord}
            />
          </div>

          {/* Clues - tabs on mobile, side by side on desktop */}
          <div className="flex-1 lg:flex lg:flex-col">
            {/* Mobile: tabs */}
            <div className="lg:hidden">
              <Tabs value={mobileClueTab} onValueChange={(v) => setMobileClueTab(v as "across" | "down")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="across">Across</TabsTrigger>
                  <TabsTrigger value="down">Down</TabsTrigger>
                </TabsList>
                <TabsContent value="across" className="h-48 overflow-auto">
                  <CrosswordClueList
                    clues={puzzle.clues}
                    selectedClueId={selectedClue?.id || null}
                    completedClueIds={completedClueIds}
                    correctClueIds={correctClueIds}
                    onClueClick={handleClueClick}
                    direction="across"
                  />
                </TabsContent>
                <TabsContent value="down" className="h-48 overflow-auto">
                  <CrosswordClueList
                    clues={puzzle.clues}
                    selectedClueId={selectedClue?.id || null}
                    completedClueIds={completedClueIds}
                    correctClueIds={correctClueIds}
                    onClueClick={handleClueClick}
                    direction="down"
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop: side by side */}
            <div className="hidden lg:flex lg:flex-col gap-6 flex-1">
              <div className="flex gap-6 flex-1">
                <CrosswordClueList
                  clues={puzzle.clues}
                  selectedClueId={selectedClue?.id || null}
                  completedClueIds={completedClueIds}
                  correctClueIds={correctClueIds}
                  onClueClick={handleClueClick}
                  direction="across"
                  className="flex-1 min-w-0"
                />
                <CrosswordClueList
                  clues={puzzle.clues}
                  selectedClueId={selectedClue?.id || null}
                  completedClueIds={completedClueIds}
                  correctClueIds={correctClueIds}
                  onClueClick={handleClueClick}
                  direction="down"
                  className="flex-1 min-w-0"
                />
              </div>
              {/* Desktop action buttons - under clues */}
              <div className="flex gap-4 flex-shrink-0">
                <Button
                  onClick={handleCheckAnswers}
                  variant="outline"
                  className="flex-1 px-8 py-5 text-base"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Check Answers
                </Button>
                <Button
                  onClick={handleRevealAll}
                  variant="outline"
                  className="flex-1 px-8 py-5 text-base"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Reveal All
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile action buttons - centered below */}
        <div className="flex justify-center gap-4 mt-6 lg:hidden">
          <Button
            onClick={handleCheckAnswers}
            variant="outline"
            className="px-6"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Check Answers
          </Button>
          <Button
            onClick={handleRevealAll}
            variant="outline"
            className="px-6"
          >
            <Eye className="w-4 h-4 mr-2" />
            Reveal All
          </Button>
        </div>
      </div>
    );
  }

  // Render results phase
  if (phase === "results" && puzzle) {
    const timeMs = endTime && startTime ? endTime - startTime : 0;
    const correctCount = correctClueIds.size;
    const totalCount = puzzle.clues.length;
    const percentage = Math.round((correctCount / totalCount) * 100);

    // Group clues by book
    const cluesByBook = puzzle.clues.reduce((acc, clue) => {
      if (!acc[clue.bookTitle]) {
        acc[clue.bookTitle] = [];
      }
      acc[clue.bookTitle].push(clue);
      return acc;
    }, {} as Record<string, CrosswordClue[]>);

    return (
      <div className="min-h-screen p-4 lg:p-6">
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
          />
        )}

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">
            {percentage === 100 && hintsUsed === 0 ? (
              <span className="text-emerald-600">Perfect!</span>
            ) : percentage >= 80 ? (
              <span className="text-emerald-600">Great Job!</span>
            ) : percentage >= 50 ? (
              <span className="text-amber-600">Good Effort!</span>
            ) : (
              <span className="text-gray-600">Keep Practicing!</span>
            )}
          </h1>
          {/* Stats */}
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <p className="text-xl lg:text-2xl font-bold text-emerald-600">
                {correctCount}/{totalCount}
              </p>
              <p className="text-xs text-gray-500">Words</p>
            </div>
            <div className="text-center">
              <p className="text-xl lg:text-2xl font-bold text-blue-600">
                {formatTime(timeMs)}
              </p>
              <p className="text-xs text-gray-500">Time</p>
            </div>
            <div className="text-center">
              <p className="text-xl lg:text-2xl font-bold text-purple-600">{hintsUsed}</p>
              <p className="text-xs text-gray-500">Hints</p>
            </div>
          </div>
        </div>

        {/* Main content - grid and answers side by side on desktop */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center">
          {/* Completed crossword grid - max 60% width on desktop */}
          <div className="flex justify-center lg:max-w-[60%] lg:flex-shrink-0">
            <CrosswordGrid
              grid={puzzle.grid}
              rows={puzzle.rows}
              cols={puzzle.cols}
              cellNumbers={Object.fromEntries(puzzle.cellNumbers)}
              clues={puzzle.clues}
              userAnswers={userAnswers}
              selectedCell={null}
              selectedDirection="across"
              selectedClue={null}
              correctCells={new Set()}
              incorrectCells={new Set()}
              revealedCells={revealedCells}
              onCellClick={() => {}}
              onLetterInput={() => {}}
              onBackspace={() => {}}
              onNavigate={() => {}}
              onDirectionToggle={() => {}}
              onNextWord={() => {}}
              onPrevWord={() => {}}
            />
          </div>

          {/* Answers panel */}
          <Card className="w-full lg:w-80 xl:w-96">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Answers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm max-h-80 lg:max-h-[500px] overflow-y-auto">
                {Object.entries(cluesByBook).map(([bookTitle, clues]) => (
                  <div key={bookTitle}>
                    <p className="font-medium text-gray-800 mb-2">{bookTitle}</p>
                    <div className="space-y-3 pl-2">
                      {clues.map((clue) => (
                        <div key={clue.id}>
                          <div className="flex gap-2 items-baseline">
                            <span className="text-gray-500 flex-shrink-0 text-xs">
                              {clue.number}{clue.direction === "across" ? "A" : "D"}
                            </span>
                            <span className="text-emerald-700 font-semibold">
                              {clue.answer}
                            </span>
                          </div>
                          <p className="text-gray-600 text-xs mt-0.5 pl-6">
                            {clue.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-6 pt-4 border-t">
                <Button
                  onClick={handleNewPuzzle}
                  className="w-full bg-amber-500 hover:bg-amber-600"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  New Puzzle
                </Button>
                <Button onClick={onExit} variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Exit
                </Button>
              </div>
            </CardContent>
          </Card>
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
