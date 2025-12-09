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
 * Calculate density score for a layout.
 * Higher scores indicate denser, more interconnected puzzles.
 */
function calculateDensityScore(layout: LayoutResult): number {
  const placedWords = layout.result.filter((w) => w.orientation !== "none");
  if (placedWords.length === 0) return 0;

  // Count letter cells and intersections
  const cellMap = new Map<string, number>(); // "row,col" -> count of words using it

  for (const word of placedWords) {
    const startRow = word.starty - 1;
    const startCol = word.startx - 1;

    for (let i = 0; i < word.answer.length; i++) {
      const row = word.orientation === "down" ? startRow + i : startRow;
      const col = word.orientation === "across" ? startCol + i : startCol;
      const key = `${row},${col}`;
      cellMap.set(key, (cellMap.get(key) || 0) + 1);
    }
  }

  const totalLetterCells = cellMap.size;
  const intersections = Array.from(cellMap.values()).filter((count) => count > 1).length;
  const gridArea = layout.rows * layout.cols;

  // Density metrics (all normalized to 0-1 range, higher is better)

  // 1. Fill ratio: what percentage of the grid has letters
  const fillRatio = totalLetterCells / gridArea;

  // 2. Intersection ratio: what percentage of letter cells are intersections
  const intersectionRatio = totalLetterCells > 0 ? intersections / totalLetterCells : 0;

  // 3. Words per area: how many words packed into the grid
  const wordsPerArea = placedWords.length / gridArea;

  // 4. Compactness: prefer square-ish grids (penalize long skinny grids)
  const aspectRatio = Math.min(layout.rows, layout.cols) / Math.max(layout.rows, layout.cols);

  // 5. Average intersections per word (classic crosswords have ~2-3 per word)
  const avgIntersectionsPerWord = placedWords.length > 0 ? intersections / placedWords.length : 0;
  const intersectionPerWordScore = Math.min(avgIntersectionsPerWord / 3, 1); // Cap at 1

  // Weighted combination - prioritize intersections and fill ratio
  const score =
    fillRatio * 0.25 +
    intersectionRatio * 0.30 +
    wordsPerArea * 10 * 0.15 + // Scale up since this is typically small
    aspectRatio * 0.10 +
    intersectionPerWordScore * 0.20;

  return score;
}

/**
 * Generate a crossword puzzle from a list of questions.
 * Uses multiple attempts with different word subsets to find the densest layout.
 * Returns null if unable to generate a valid puzzle.
 *
 * @param questions - Pool of candidate questions (should be 2-3x the target count)
 * @param targetWordCount - Desired number of words in the final puzzle
 * @param maxAttempts - Number of different layouts to try
 */
export function generateCrossword(
  questions: CrosswordQuestion[],
  targetWordCount?: number,
  maxAttempts: number = 30
): CrosswordPuzzle | null {
  if (questions.length < 4) {
    console.warn("Not enough questions to generate crossword");
    return null;
  }

  // If no target specified, try to place all words
  const target = targetWordCount || questions.length;

  let bestLayout: LayoutResult | null = null;
  let bestScore = -1;
  let bestPlacedCount = 0;

  // Try multiple times with different word subsets and shuffles
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Shuffle all questions
    const shuffled = shuffleArray([...questions]);

    // Take a subset - vary the subset size for diversity
    // Sometimes use all words, sometimes use fewer
    const subsetSize = Math.min(
      questions.length,
      target + Math.floor(Math.random() * (questions.length - target + 1))
    );
    const subset = shuffled.slice(0, Math.max(subsetSize, target));

    // Prepare input for the library
    const input: LayoutInput[] = subset.map((q) => ({
      clue: q.text,
      answer: q.answer,
    }));

    try {
      const layout: LayoutResult = clg.generateLayout(input);

      // Count how many words were actually placed
      const placedWords = layout.result.filter(
        (w) => w.orientation !== "none"
      );

      // Skip if we didn't place enough words
      if (placedWords.length < 4) continue;

      // Calculate density score
      const score = calculateDensityScore(layout);

      // Prefer layouts that:
      // 1. Have higher density scores
      // 2. Have at least the target word count (if possible)
      const meetsTarget = placedWords.length >= target;
      const currentMeetsTarget = bestLayout ?
        bestLayout.result.filter((w) => w.orientation !== "none").length >= target : false;

      // Update best if:
      // - This meets target and previous didn't, OR
      // - Both meet target (or both don't) and this has better score
      if (
        (meetsTarget && !currentMeetsTarget) ||
        (meetsTarget === currentMeetsTarget && score > bestScore)
      ) {
        bestScore = score;
        bestLayout = layout;
        bestPlacedCount = placedWords.length;
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

  console.log(`Generated crossword: ${bestPlacedCount} words, density score: ${bestScore.toFixed(3)}`);

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
