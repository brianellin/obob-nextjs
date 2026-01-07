/**
 * GET /api/daily-crossword/puzzle
 *
 * Returns today's daily puzzle for a year/division.
 * The puzzle is deterministic - everyone gets the same puzzle.
 */

import { NextResponse } from "next/server";
import {
  getOrGenerateDailyPuzzle,
  getTodaysPuzzleDate,
  getTimeUntilNextPuzzle,
} from "@/lib/daily-crossword/generate-daily";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const division = searchParams.get("division");

    if (!year || !division) {
      return NextResponse.json(
        { error: "year and division are required" },
        { status: 400 }
      );
    }

    // Validate year/division format
    if (!/^\d{4}-\d{4}$/.test(year)) {
      return NextResponse.json(
        { error: "Invalid year format. Expected YYYY-YYYY" },
        { status: 400 }
      );
    }

    if (!["3-5", "6-8", "9-12"].includes(division)) {
      return NextResponse.json(
        { error: "Invalid division. Expected 3-5, 6-8, or 9-12" },
        { status: 400 }
      );
    }

    const puzzleDate = getTodaysPuzzleDate();
    const puzzle = await getOrGenerateDailyPuzzle(year, division, puzzleDate);

    if (!puzzle) {
      return NextResponse.json(
        { error: `No puzzle available for ${year}/${division} on ${puzzleDate}` },
        { status: 404 }
      );
    }

    const timeUntilNext = getTimeUntilNextPuzzle();

    return NextResponse.json({
      success: true,
      puzzle: puzzle.puzzle,
      dateString: puzzle.dateString,
      clueCount: puzzle.clueCount,
      generatedAt: puzzle.generatedAt,
      timeUntilNext,
    });
  } catch (error) {
    console.error("Error getting daily puzzle:", error);
    return NextResponse.json(
      {
        error: "Failed to get daily puzzle",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
