/**
 * Daily puzzle generation with Pacific Time handling
 *
 * Generates deterministic puzzles based on date - everyone gets
 * the same puzzle for a given day/division combination.
 */

import path from "path";
import fs from "fs/promises";
import type { Book } from "@/types";
import { getAllQuestions } from "@/lib/questions";
import { filterCrosswordQuestions } from "@/lib/crossword/utils";
import { generateCrossword, type GeneratorOptions } from "@/lib/crossword/generator";
import type { CrosswordPuzzle } from "@/lib/crossword/types";
import { createSeededRandom, seededSelectDistributed } from "./seeded-random";
import type { DailyPuzzle, SerializedCrosswordPuzzle } from "./types";

const PRE_GENERATED_DIR = path.join(process.cwd(), "content", "daily-crosswords");

const puzzleCache = new Map<string, DailyPuzzle>();

async function getPreGeneratedPuzzle(
  year: string,
  division: string,
  dateString: string
): Promise<DailyPuzzle | null> {
  const cacheKey = `${year}:${division}:${dateString}`;
  
  if (puzzleCache.has(cacheKey)) {
    return puzzleCache.get(cacheKey)!;
  }

  const filePath = path.join(PRE_GENERATED_DIR, year, division, `crossword-${dateString}.json`);
  
  try {
    const data = await fs.readFile(filePath, "utf8");
    const puzzle = JSON.parse(data) as DailyPuzzle;
    puzzleCache.set(cacheKey, puzzle);
    return puzzle;
  } catch {
    return null;
  }
}

/**
 * Get the current date string in Pacific Time
 */
export function getPacificDateString(date: Date = new Date()): string {
  const ptFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return ptFormatter.format(date); // "2025-01-15"
}

/**
 * Get the current hour in Pacific Time (0-23)
 */
export function getPacificHour(date: Date = new Date()): number {
  const ptFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    hour12: false,
  });

  return parseInt(ptFormatter.format(date), 10);
}

/**
 * Get today's puzzle date (accounting for 6am PT cutoff)
 *
 * Before 6am PT, returns yesterday's date.
 * At or after 6am PT, returns today's date.
 */
export function getTodaysPuzzleDate(now: Date = new Date()): string {
  const hour = getPacificHour(now);
  const dateString = getPacificDateString(now);

  if (hour < 6) {
    // Before 6am, use yesterday's puzzle
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return getPacificDateString(yesterday);
  }

  return dateString;
}

/**
 * Load all books for a year/division
 */
async function loadBooks(year: string, division: string): Promise<Book[]> {
  const booksPath = path.join(
    process.cwd(),
    "public",
    "obob",
    year,
    division,
    "books.json"
  );
  const booksData = JSON.parse(await fs.readFile(booksPath, "utf8"));
  return Object.values(booksData.books) as Book[];
}

/**
 * Convert a CrosswordPuzzle to serialized format for JSON storage
 */
function serializePuzzle(puzzle: CrosswordPuzzle): SerializedCrosswordPuzzle {
  // Convert Map to Record for JSON serialization
  const cellNumbers: Record<string, number> = {};
  for (const [key, value] of puzzle.cellNumbers) {
    cellNumbers[key] = value;
  }

  return {
    grid: puzzle.grid,
    clues: puzzle.clues,
    rows: puzzle.rows,
    cols: puzzle.cols,
    cellNumbers,
  };
}

/**
 * Daily puzzle generation options (always medium size with all books)
 */
const DAILY_OPTIONS: Omit<GeneratorOptions, "random"> = {
  targetWords: 20,
  maxGridSize: 24,
  minWords: 14,
  maxAttempts: 50,
};

/**
 * Get the daily puzzle for a year/division
 *
 * Only returns pre-generated puzzles from content/daily-crosswords.json.
 * Returns null if no puzzle exists for the given date.
 */
export async function getOrGenerateDailyPuzzle(
  year: string,
  division: string,
  dateString?: string
): Promise<DailyPuzzle | null> {
  const puzzleDate = dateString || getTodaysPuzzleDate();

  const preGenerated = await getPreGeneratedPuzzle(year, division, puzzleDate);
  if (preGenerated) {
    return preGenerated;
  }

  console.warn(`No pre-generated puzzle for ${year}/${division}/${puzzleDate}`);
  return null;
}

/**
 * Generate a new daily puzzle (deterministic based on date)
 */
export async function generateDailyPuzzle(
  year: string,
  division: string,
  dateString: string
): Promise<DailyPuzzle> {
  // Create deterministic seed from date + division
  const seed = `${year}:${division}:${dateString}`;
  const random = createSeededRandom(seed);

  // Load all books for this division
  const allBooks = await loadBooks(year, division);
  const allBookKeys = allBooks.map((b) => b.book_key);

  // Load all questions
  const allQuestions = await getAllQuestions(year, division);

  // Filter to valid crossword questions from ALL books
  const validQuestions = filterCrosswordQuestions(
    allQuestions,
    allBookKeys,
    allBooks
  );

  if (validQuestions.length < DAILY_OPTIONS.minWords) {
    throw new Error(
      `Not enough valid crossword questions (${validQuestions.length}) for daily puzzle. Need at least ${DAILY_OPTIONS.minWords}.`
    );
  }

  // Select candidate questions with even book distribution and deduplication
  // Get 2x target for optimization - the generator will pick the best subset
  const candidateCount = DAILY_OPTIONS.targetWords * 2;
  const candidates = seededSelectDistributed(validQuestions, candidateCount, random);

  // Generate puzzle with seeded random
  const puzzle = generateCrossword(candidates, {
    ...DAILY_OPTIONS,
    random,
  });

  if (!puzzle) {
    throw new Error(
      `Failed to generate daily crossword puzzle for ${year}/${division} on ${dateString}`
    );
  }

  const dailyPuzzle: DailyPuzzle = {
    id: seed,
    year,
    division,
    dateString,
    puzzle: serializePuzzle(puzzle),
    generatedAt: Date.now(),
    clueCount: puzzle.clues.length,
  };

  return dailyPuzzle;
}

/**
 * Get time until next puzzle (6am PT)
 * Returns { hours, minutes, seconds }
 */
export function getTimeUntilNextPuzzle(now: Date = new Date()): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  // Get current PT time components
  const ptOptions: Intl.DateTimeFormatOptions = {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  };

  const parts = new Intl.DateTimeFormat("en-US", ptOptions).formatToParts(now);
  const currentHour = parseInt(
    parts.find((p) => p.type === "hour")?.value || "0",
    10
  );
  const currentMinute = parseInt(
    parts.find((p) => p.type === "minute")?.value || "0",
    10
  );
  const currentSecond = parseInt(
    parts.find((p) => p.type === "second")?.value || "0",
    10
  );

  // Calculate seconds until 6am
  let targetHour = 6;
  if (currentHour >= 6) {
    // Next 6am is tomorrow
    targetHour = 6 + 24;
  }

  const currentSeconds =
    currentHour * 3600 + currentMinute * 60 + currentSecond;
  const targetSeconds = targetHour * 3600;
  let secondsUntil = targetSeconds - currentSeconds;

  if (secondsUntil < 0) {
    secondsUntil += 24 * 3600;
  }

  const hours = Math.floor(secondsUntil / 3600);
  const minutes = Math.floor((secondsUntil % 3600) / 60);
  const seconds = secondsUntil % 60;

  return { hours, minutes, seconds };
}
