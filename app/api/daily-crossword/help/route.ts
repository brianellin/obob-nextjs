/**
 * POST /api/daily-crossword/help
 *
 * Create a help request for a specific clue.
 * Returns a shareable link that can be sent to teammates.
 * 
 * Note: This endpoint doesn't use KV for team lookup - the client passes
 * year/division/puzzleDate directly since the game state is managed by
 * the Cloudflare Durable Object.
 */

import { NextResponse } from "next/server";
import { getOrGenerateDailyPuzzle } from "@/lib/daily-crossword/generate-daily";
import { normalizeTeamCode, isValidTeamCode } from "@/lib/daily-crossword/team-codes";
import type { CrosswordClue } from "@/lib/crossword/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamCode: inputCode, clueId, year, division, puzzleDate } = body;

    if (!inputCode || !clueId || !year || !division || !puzzleDate) {
      return NextResponse.json(
        { error: "teamCode, clueId, year, division, and puzzleDate are required" },
        { status: 400 }
      );
    }

    if (!isValidTeamCode(inputCode)) {
      return NextResponse.json(
        { error: "Invalid team code format" },
        { status: 400 }
      );
    }

    const teamCode = normalizeTeamCode(inputCode);

    // Get the puzzle to find the clue
    const dailyPuzzle = await getOrGenerateDailyPuzzle(year, division, puzzleDate);

    if (!dailyPuzzle) {
      return NextResponse.json(
        { error: "No puzzle available for today" },
        { status: 404 }
      );
    }

    const clues = dailyPuzzle.puzzle.clues as CrosswordClue[];
    const clue = clues.find((c) => c.id === clueId);

    if (!clue) {
      return NextResponse.json({ error: "Clue not found" }, { status: 404 });
    }

    // Generate the share URL - goes directly to the crossword with team code and clue selection
    const host = request.headers.get("host") || "obob.dog";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const clueRef = `${clue.number}-${clue.direction}`;
    const shareUrl = `${baseUrl}/crossword/${year}/${division}?team=${teamCode}&clue=${clueRef}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      clue: {
        number: clue.number,
        direction: clue.direction,
        text: clue.text,
        bookTitle: clue.bookTitle,
      },
    });
  } catch (error) {
    console.error("Error creating help request:", error);
    return NextResponse.json(
      {
        error: "Failed to create help request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
