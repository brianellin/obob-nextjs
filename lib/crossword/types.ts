import type { Book } from "@/types";

export type PuzzleSize = "small" | "medium" | "large";

export type GamePhase = "setup" | "playing" | "results";

export type Direction = "across" | "down";

export interface CrosswordClue {
  id: string;
  number: number;
  direction: Direction;
  text: string; // The question text
  answer: string; // Normalized uppercase answer
  startRow: number;
  startCol: number;
  length: number;
  bookKey: string;
  bookTitle: string;
  page?: number;
}

export interface CrosswordPuzzle {
  grid: (string | null)[][]; // null = black cell, string = letter
  clues: CrosswordClue[];
  rows: number;
  cols: number;
  // Mapping of "row,col" to clue numbers for cells that start words
  cellNumbers: Map<string, number>;
}

export interface CrosswordQuestion {
  text: string;
  answer: string;
  bookKey: string;
  bookTitle: string;
  page?: number;
}

export interface UserAnswers {
  // Map of "row,col" -> letter entered by user
  [key: string]: string;
}

export interface CrosswordGameState {
  phase: GamePhase;
  selectedBooks: Book[];
  puzzleSize: PuzzleSize;
  puzzle: CrosswordPuzzle | null;
  userAnswers: UserAnswers;
  selectedCell: { row: number; col: number } | null;
  selectedDirection: Direction;
  checkedCells: Set<string>; // Cells that have been checked
  correctCells: Set<string>; // Cells marked as correct after checking
  incorrectCells: Set<string>; // Cells marked as incorrect after checking
  completedClues: Set<string>; // Clue IDs that are fully and correctly filled
  startTime: number | null;
  endTime: number | null;
  hintsUsed: number;
}

// Puzzle size configurations
export const PUZZLE_SIZE_CONFIG: Record<
  PuzzleSize,
  { target: number; min: number; label: string }
> = {
  small: { target: 8, min: 4, label: "Small (6-8 words)" },
  medium: { target: 12, min: 6, label: "Medium (10-12 words)" },
  large: { target: 16, min: 8, label: "Large (14-16 words)" },
};
