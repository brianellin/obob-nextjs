"use client";

import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { CrosswordClue, Direction, UserAnswers } from "@/lib/crossword/types";
import { getClueCells } from "@/lib/crossword/generator";

interface CrosswordGridProps {
  grid: (string | null)[][];
  rows: number;
  cols: number;
  cellNumbers: Record<string, number>;
  clues: CrosswordClue[];
  userAnswers: UserAnswers;
  selectedCell: { row: number; col: number } | null;
  selectedDirection: Direction;
  selectedClue: CrosswordClue | null;
  correctCells: Set<string>;
  incorrectCells: Set<string>;
  revealedCells: Set<string>;
  onCellClick: (row: number, col: number) => void;
  onLetterInput: (letter: string) => void;
  onBackspace: () => void;
  onNavigate: (direction: "up" | "down" | "left" | "right") => void;
  onDirectionToggle: () => void;
  onNextWord: () => void;
  onPrevWord: () => void;
}

export default function CrosswordGrid({
  grid,
  rows,
  cols,
  cellNumbers,
  userAnswers,
  selectedCell,
  selectedDirection,
  selectedClue,
  correctCells,
  incorrectCells,
  revealedCells,
  onCellClick,
  onLetterInput,
  onBackspace,
  onNavigate,
  onDirectionToggle,
  onNextWord,
  onPrevWord,
}: CrosswordGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Get highlighted cells for the selected clue
  const highlightedCells = new Set<string>();
  if (selectedClue) {
    const cells = getClueCells(selectedClue);
    for (const cell of cells) {
      highlightedCells.add(`${cell.row},${cell.col}`);
    }
  }

  // Focus the hidden input when a cell is selected
  useEffect(() => {
    if (selectedCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedCell]);

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          onNavigate("up");
          break;
        case "ArrowDown":
          e.preventDefault();
          onNavigate("down");
          break;
        case "ArrowLeft":
          e.preventDefault();
          onNavigate("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          onNavigate("right");
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            onPrevWord();
          } else {
            onNextWord();
          }
          break;
        case " ":
          e.preventDefault();
          onDirectionToggle();
          break;
        case "Backspace":
          e.preventDefault();
          onBackspace();
          break;
        default:
          if (/^[a-zA-Z]$/.test(e.key)) {
            e.preventDefault();
            onLetterInput(e.key.toUpperCase());
          }
      }
    },
    [selectedCell, onNavigate, onNextWord, onPrevWord, onDirectionToggle, onBackspace, onLetterInput]
  );

  // Handle input change (for mobile keyboards)
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (value && /^[a-zA-Z]$/.test(value)) {
        onLetterInput(value.toUpperCase());
      }
      // Clear the input for next character
      e.target.value = "";
    },
    [onLetterInput]
  );

  return (
    <div className="relative">
      {/* Hidden input for capturing keyboard input */}
      <input
        ref={inputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        style={{ position: "absolute", left: "-9999px" }}
        onKeyDown={handleKeyDown}
        onChange={handleInputChange}
        autoComplete="off"
        autoCapitalize="characters"
        aria-label="Crossword input"
      />

      {/* Crossword grid */}
      <div
        ref={gridRef}
        className="inline-block border-2 border-gray-800 bg-gray-800"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gap: "2px",
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {Array.from({ length: rows }).map((_, rowIndex) =>
          Array.from({ length: cols }).map((_, colIndex) => {
            const cellValue = grid[rowIndex]?.[colIndex];
            const isBlackCell = cellValue === null;
            const cellKey = `${rowIndex},${colIndex}`;
            const cellNumber = cellNumbers[cellKey];
            const userLetter = userAnswers[cellKey] || "";
            const isSelected =
              selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
            const isHighlighted = highlightedCells.has(cellKey);
            const isCorrect = correctCells.has(cellKey);
            const isIncorrect = incorrectCells.has(cellKey);
            const isRevealed = revealedCells.has(cellKey);

            if (isBlackCell) {
              return (
                <div
                  key={cellKey}
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-gray-800"
                  aria-hidden="true"
                />
              );
            }

            return (
              <button
                key={cellKey}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCellClick(rowIndex, colIndex);
                  inputRef.current?.focus();
                }}
                className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14",
                  "relative flex items-center justify-center",
                  "text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold",
                  "transition-colors duration-100",
                  "focus:outline-none",
                  // Base state
                  "bg-white",
                  // Highlighted (part of selected word)
                  isHighlighted && !isSelected && "bg-amber-100",
                  // Selected cell
                  isSelected && "bg-cyan-200 ring-2 ring-cyan-500 ring-inset",
                  // Correct state (after checking)
                  isCorrect && "bg-emerald-100 text-emerald-700",
                  // Incorrect state (after checking)
                  isIncorrect && "bg-red-100 text-red-700",
                  // Revealed state
                  isRevealed && "text-purple-600",
                  // Animation for correct
                  isCorrect && "animate-cell-correct"
                )}
                aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}${cellNumber ? `, Clue ${cellNumber}` : ""}`}
              >
                {/* Cell number */}
                {cellNumber && (
                  <span className="absolute top-0.5 left-0.5 text-[8px] sm:text-[10px] lg:text-xs font-normal text-gray-600">
                    {cellNumber}
                  </span>
                )}
                {/* User's letter */}
                <span>{userLetter}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Direction indicator */}
      {selectedCell && (
        <div className="mt-2 text-center text-sm text-gray-600">
          <span className="inline-flex items-center gap-2">
            <span className="font-medium capitalize">{selectedDirection}</span>
            <span className="text-gray-400">(press Space to switch)</span>
          </span>
        </div>
      )}
    </div>
  );
}
