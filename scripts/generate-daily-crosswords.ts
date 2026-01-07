/**
 * Pre-generate daily crossword puzzles for the next N days
 *
 * Usage: npx tsx scripts/generate-daily-crosswords.ts [days]
 *
 * Generates puzzles for current year divisions (2024-2025, 2025-2026)
 * for each division (3-5, 6-8, 9-12) and stores them in content/daily-crosswords/{year}/{division}/
 */

import fs from "fs/promises";
import path from "path";
import { generateDailyPuzzle, getPacificDateString } from "@/lib/daily-crossword/generate-daily";
import type { DailyPuzzle } from "@/lib/daily-crossword/types";

const YEARS = ["2025-2026"];
const DIVISIONS = ["3-5", "6-8", "9-12"];
const OUTPUT_DIR = path.join(process.cwd(), "content", "daily-crosswords");

function getPuzzlePath(year: string, division: string, dateString: string): string {
  return path.join(OUTPUT_DIR, year, division, `crossword-${dateString}.json`);
}

async function puzzleExists(year: string, division: string, dateString: string): Promise<boolean> {
  try {
    await fs.access(getPuzzlePath(year, division, dateString));
    return true;
  } catch {
    return false;
  }
}

async function savePuzzle(puzzle: DailyPuzzle): Promise<void> {
  const filePath = getPuzzlePath(puzzle.year, puzzle.division, puzzle.dateString);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(puzzle, null, 2));
}

function getUpcomingDays(n: number): string[] {
  const dates: string[] = [];
  const now = new Date();

  // Start from today (i = 0), then n days into the future
  for (let i = 0; i <= n; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    dates.push(getPacificDateString(date));
  }

  return dates;
}

async function main() {
  const daysToGenerate = parseInt(process.argv[2] || "7", 10);
  const today = getPacificDateString(new Date());
  console.log(`Today (Pacific): ${today}`);
  console.log(`Generating puzzles for today + next ${daysToGenerate} days...`);

  const dates = getUpcomingDays(daysToGenerate);
  console.log(`Dates: ${dates.join(", ")}`);

  let generated = 0;
  let skipped = 0;

  for (const year of YEARS) {
    for (const division of DIVISIONS) {
      for (const dateString of dates) {
        const key = `${year}/${division}/crossword-${dateString}.json`;

        // Skip if puzzle already exists (never overwrite)
        if (await puzzleExists(year, division, dateString)) {
          console.log(`  Skipping ${key} (already exists)`);
          skipped++;
          continue;
        }

        try {
          console.log(`  Generating ${key}...`);
          const puzzle = await generateDailyPuzzle(year, division, dateString);
          await savePuzzle(puzzle);
          generated++;
        } catch (error) {
          console.error(`  Failed to generate ${key}:`, error);
        }
      }
    }
  }

  console.log(`\nDone!`);
  console.log(`  Generated: ${generated} new puzzles`);
  console.log(`  Skipped: ${skipped} existing puzzles`);
  console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch(console.error);
