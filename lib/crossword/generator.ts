import type { CrosswordQuestion, CrosswordPuzzle, CrosswordClue } from "./types";

// The library uses CommonJS, we need to handle the import
// eslint-disable-next-line @typescript-eslint/no-require-imports
const clg = require("crossword-layout-generator");

interface LayoutInput {
  clue: string;
  answer: string;
}

interface LayoutResultWord {
  clue: string;
  answer: string;
  startx: number;
  starty: number;
  position: number;
  orientation: "across" | "down" | "none";
}

interface LayoutResult {
  rows: number;
  cols: number;
  table: (string | "-")[][];
  table_string: string;
  result: LayoutResultWord[];
}

/**
 * Generate a crossword puzzle from a list of questions.
 * Returns null if unable to generate a valid puzzle.
 */
export function generateCrossword(
  questions: CrosswordQuestion[],
  maxAttempts: number = 10
): CrosswordPuzzle | null {
  if (questions.length < 4) {
    console.warn("Not enough questions to generate crossword");
    return null;
  }

  let bestLayout: LayoutResult | null = null;
  let bestPlacedCount = 0;

  // Try multiple times with shuffled input to get the best layout
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffled = shuffleArray([...questions]);

    // Prepare input for the library
    const input: LayoutInput[] = shuffled.map((q) => ({
      clue: q.text,
      answer: q.answer,
    }));

    try {
      const layout: LayoutResult = clg.generateLayout(input);

      // Count how many words were actually placed
      const placedWords = layout.result.filter(
        (w) => w.orientation !== "none"
      );

      if (placedWords.length > bestPlacedCount) {
        bestPlacedCount = placedWords.length;
        bestLayout = layout;
      }

      // If we placed all words, no need to try again
      if (placedWords.length === questions.length) {
        break;
      }
    } catch (error) {
      console.error("Crossword generation attempt failed:", error);
    }
  }

  if (!bestLayout || bestPlacedCount < 4) {
    console.warn(
      `Could not generate valid crossword. Best attempt placed ${bestPlacedCount} words.`
    );
    return null;
  }

  // Build the puzzle from the best layout
  return buildPuzzleFromLayout(bestLayout, questions);
}

/**
 * Convert the library's layout result into our CrosswordPuzzle format
 * Always produces a square grid for consistent layout across devices
 */
function buildPuzzleFromLayout(
  layout: LayoutResult,
  questions: CrosswordQuestion[]
): CrosswordPuzzle {
  // Create question lookup map
  const questionMap = new Map<string, CrosswordQuestion>();
  for (const q of questions) {
    questionMap.set(q.answer, q);
  }

  // Determine the square size (use the larger dimension)
  const size = Math.max(layout.rows, layout.cols);

  // Calculate offsets to center the content in the square grid
  const rowOffset = Math.floor((size - layout.rows) / 2);
  const colOffset = Math.floor((size - layout.cols) / 2);

  // Build the square grid (convert "-" to null for black cells)
  const grid: (string | null)[][] = [];
  for (let row = 0; row < size; row++) {
    const gridRow: (string | null)[] = [];
    for (let col = 0; col < size; col++) {
      // Map back to original layout coordinates
      const origRow = row - rowOffset;
      const origCol = col - colOffset;

      // Check if we're within the original layout bounds
      if (origRow >= 0 && origRow < layout.rows && origCol >= 0 && origCol < layout.cols) {
        const cell = layout.table[origRow]?.[origCol];
        gridRow.push(cell === "-" || !cell ? null : cell);
      } else {
        // Outside original bounds - black cell
        gridRow.push(null);
      }
    }
    grid.push(gridRow);
  }

  // Build clues from placed words
  const clues: CrosswordClue[] = [];
  const cellNumbers = new Map<string, number>();

  // Sort by position number for consistent ordering
  const placedWords = layout.result
    .filter((w) => w.orientation !== "none")
    .sort((a, b) => a.position - b.position);

  for (const word of placedWords) {
    const question = questionMap.get(word.answer);
    if (!question) continue;

    // Library uses 1-indexed positions, convert to 0-indexed
    // Then apply offset for centered square grid
    const startRow = word.starty - 1 + rowOffset;
    const startCol = word.startx - 1 + colOffset;

    const clue: CrosswordClue = {
      id: `${word.position}-${word.orientation}`,
      number: word.position,
      direction: word.orientation as "across" | "down",
      text: question.text,
      answer: word.answer,
      startRow,
      startCol,
      length: word.answer.length,
      bookKey: question.bookKey,
      bookTitle: question.bookTitle,
      page: question.page,
    };

    clues.push(clue);

    // Track cell numbers (for displaying numbers in grid)
    const cellKey = `${startRow},${startCol}`;
    if (!cellNumbers.has(cellKey)) {
      cellNumbers.set(cellKey, word.position);
    }
  }

  return {
    grid,
    clues,
    rows: size,
    cols: size,
    cellNumbers,
  };
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get the cells that belong to a specific clue
 */
export function getClueCells(
  clue: CrosswordClue
): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];

  for (let i = 0; i < clue.length; i++) {
    if (clue.direction === "across") {
      cells.push({ row: clue.startRow, col: clue.startCol + i });
    } else {
      cells.push({ row: clue.startRow + i, col: clue.startCol });
    }
  }

  return cells;
}

/**
 * Check if a clue is correctly filled in
 */
export function isClueCorrect(
  clue: CrosswordClue,
  userAnswers: Record<string, string>
): boolean {
  const cells = getClueCells(clue);

  for (let i = 0; i < cells.length; i++) {
    const cellKey = `${cells[i].row},${cells[i].col}`;
    const userLetter = userAnswers[cellKey]?.toUpperCase() || "";
    const correctLetter = clue.answer[i];

    if (userLetter !== correctLetter) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a clue is fully filled (may or may not be correct)
 */
export function isClueFilled(
  clue: CrosswordClue,
  userAnswers: Record<string, string>
): boolean {
  const cells = getClueCells(clue);

  for (const cell of cells) {
    const cellKey = `${cell.row},${cell.col}`;
    if (!userAnswers[cellKey]) {
      return false;
    }
  }

  return true;
}
