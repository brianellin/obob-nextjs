/**
 * GET /api/daily-crossword/archive/[date]
 *
 * Returns a past puzzle by date for a year/division.
 * Only serves puzzles older than today to prevent spoilers.
 */

import { NextResponse } from "next/server";
import {
  getOrGenerateDailyPuzzle,
  getTodaysPuzzleDate,
} from "@/lib/daily-crossword/generate-daily";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const division = searchParams.get("division");

    if (!year || !division) {
      return NextResponse.json(
        { error: "year and division are required" },
        { status: 400 }
      );
    }

    // Don't serve today's puzzle
    const todayDate = getTodaysPuzzleDate();
    if (date >= todayDate) {
      return NextResponse.json(
        { error: "Cannot view today's or future puzzles" },
        { status: 403 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    const puzzle = await getOrGenerateDailyPuzzle(year, division, date);

    if (!puzzle) {
      return NextResponse.json(
        { error: "Puzzle not found for this date" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      puzzle: puzzle.puzzle,
      dateString: puzzle.dateString,
      clueCount: puzzle.clueCount,
    });
  } catch (error) {
    console.error("Error getting archive puzzle:", error);
    return NextResponse.json(
      { error: "Failed to get puzzle" },
      { status: 500 }
    );
  }
}
