/**
 * POST /api/daily-crossword/help
 *
 * Create a help request for a specific clue.
 * Returns a shareable link that can be sent to teammates.
 */

import { NextResponse } from "next/server";
import { getTeamState, setHelpRequest } from "@/lib/daily-crossword/kv";
import { getOrGenerateDailyPuzzle } from "@/lib/daily-crossword/generate-daily";
import { generateHelpId, normalizeTeamCode, isValidTeamCode } from "@/lib/daily-crossword/team-codes";
import type { HelpRequest } from "@/lib/daily-crossword/types";
import type { CrosswordClue } from "@/lib/crossword/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamCode: inputCode, clueId } = body;

    if (!inputCode || !clueId) {
      return NextResponse.json(
        { error: "teamCode and clueId are required" },
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
    const teamState = await getTeamState(teamCode);

    if (!teamState) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get the puzzle to find the clue
    const dailyPuzzle = await getOrGenerateDailyPuzzle(
      teamState.year,
      teamState.division,
      teamState.puzzleDate
    );

    const clues = dailyPuzzle.puzzle.clues as CrosswordClue[];
    const clue = clues.find((c) => c.id === clueId);

    if (!clue) {
      return NextResponse.json({ error: "Clue not found" }, { status: 404 });
    }

    // Create the help request
    const helpId = generateHelpId();
    const helpRequest: HelpRequest = {
      helpId,
      teamCode,
      clueId: clue.id,
      clueNumber: clue.number,
      clueDirection: clue.direction,
      clueText: clue.text,
      bookTitle: clue.bookTitle,
      bookKey: clue.bookKey,
      page: clue.page,
      createdAt: Date.now(),
      answeredAt: null,
      answer: null,
    };

    await setHelpRequest(helpRequest);

    // Generate the share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://obob.dog";
    const shareUrl = `${baseUrl}/help/${helpId}`;

    return NextResponse.json({
      success: true,
      helpId,
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
