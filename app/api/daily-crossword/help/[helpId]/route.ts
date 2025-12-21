/**
 * GET/POST /api/daily-crossword/help/[helpId]
 *
 * GET: Get the help request details (clue, book, page)
 * POST: Submit an answer for the help request
 */

import { NextResponse } from "next/server";
import {
  getHelpRequest,
  setHelpRequest,
  getTeamState,
  setTeamState,
} from "@/lib/daily-crossword/kv";
import { getOrGenerateDailyPuzzle } from "@/lib/daily-crossword/generate-daily";
import { isClueCorrect } from "@/lib/crossword/generator";
import type { CrosswordClue } from "@/lib/crossword/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ helpId: string }> }
) {
  try {
    const { helpId } = await params;

    const helpRequest = await getHelpRequest(helpId);

    if (!helpRequest) {
      return NextResponse.json(
        {
          error: "Help request not found or expired",
          expired: true,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      helpRequest: {
        helpId: helpRequest.helpId,
        clueNumber: helpRequest.clueNumber,
        clueDirection: helpRequest.clueDirection,
        clueText: helpRequest.clueText,
        bookTitle: helpRequest.bookTitle,
        page: helpRequest.page,
        answeredAt: helpRequest.answeredAt,
        // Don't include answer or teamCode for security
      },
    });
  } catch (error) {
    console.error("Error getting help request:", error);
    return NextResponse.json(
      {
        error: "Failed to get help request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ helpId: string }> }
) {
  try {
    const { helpId } = await params;
    const body = await request.json();
    const { answer } = body;

    if (!answer || typeof answer !== "string") {
      return NextResponse.json(
        { error: "answer is required" },
        { status: 400 }
      );
    }

    const helpRequest = await getHelpRequest(helpId);

    if (!helpRequest) {
      return NextResponse.json(
        {
          error: "Help request not found or expired",
          expired: true,
        },
        { status: 404 }
      );
    }

    // Already answered
    if (helpRequest.answeredAt) {
      return NextResponse.json(
        {
          error: "This help request has already been answered",
          alreadyAnswered: true,
        },
        { status: 400 }
      );
    }

    // Get the team state
    const teamState = await getTeamState(helpRequest.teamCode);
    if (!teamState) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get the puzzle to find the clue
    const dailyPuzzle = await getOrGenerateDailyPuzzle(
      teamState.year,
      teamState.division,
      teamState.puzzleDate
    );

    const clues = dailyPuzzle.puzzle.clues as CrosswordClue[];
    const clue = clues.find((c) => c.id === helpRequest.clueId);

    if (!clue) {
      return NextResponse.json(
        { error: "Clue not found in puzzle" },
        { status: 404 }
      );
    }

    // Normalize the submitted answer
    const normalizedAnswer = answer
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, "");

    // Fill in the answer in the team's puzzle
    // Get the cells for this clue
    for (let i = 0; i < clue.length; i++) {
      let row: number, col: number;
      if (clue.direction === "across") {
        row = clue.startRow;
        col = clue.startCol + i;
      } else {
        row = clue.startRow + i;
        col = clue.startCol;
      }

      const letter = normalizedAnswer[i] || "";
      if (letter) {
        teamState.answers[`${row},${col}`] = letter;
      }
    }

    teamState.lastActivity = Date.now();

    // Check if clue is now correct
    const isCorrect = isClueCorrect(clue, teamState.answers);

    // Update correct clues list
    if (isCorrect && !teamState.correctClues.includes(clue.id)) {
      teamState.correctClues.push(clue.id);
    }

    await setTeamState(teamState);

    // Mark help request as answered
    helpRequest.answeredAt = Date.now();
    helpRequest.answer = normalizedAnswer;
    await setHelpRequest(helpRequest);

    return NextResponse.json({
      success: true,
      isCorrect,
      message: isCorrect
        ? "Great job! Your answer was correct and has been added to the puzzle."
        : "Answer submitted. Check with your team to see if it's correct!",
    });
  } catch (error) {
    console.error("Error submitting help answer:", error);
    return NextResponse.json(
      {
        error: "Failed to submit answer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
