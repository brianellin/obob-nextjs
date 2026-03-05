/**
 * GET /api/daily-crossword/archive
 *
 * Returns a list of available past puzzle dates for a year/division.
 * Excludes today's puzzle to prevent spoilers.
 */

import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getTodaysPuzzleDate } from "@/lib/daily-crossword/generate-daily";

const PRE_GENERATED_DIR = path.join(process.cwd(), "content", "daily-crosswords");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const division = searchParams.get("division");
    const limit = parseInt(searchParams.get("limit") || "7", 10);

    if (!year || !division) {
      return NextResponse.json(
        { error: "year and division are required" },
        { status: 400 }
      );
    }

    if (!["3-5", "6-8", "9-12"].includes(division)) {
      return NextResponse.json(
        { error: "Invalid division" },
        { status: 400 }
      );
    }

    const dir = path.join(PRE_GENERATED_DIR, year, division);
    const todayDate = getTodaysPuzzleDate();

    let files: string[];
    try {
      files = await fs.readdir(dir);
    } catch {
      return NextResponse.json({ dates: [] });
    }

    // Extract dates from filenames, filter to past dates only, sort descending
    const dates = files
      .filter((f) => f.startsWith("crossword-") && f.endsWith(".json"))
      .map((f) => f.replace("crossword-", "").replace(".json", ""))
      .filter((d) => d < todayDate)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, limit);

    return NextResponse.json({ dates });
  } catch (error) {
    console.error("Error listing archive:", error);
    return NextResponse.json(
      { error: "Failed to list archive" },
      { status: 500 }
    );
  }
}
