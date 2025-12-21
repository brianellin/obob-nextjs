/**
 * POST /api/daily-crossword/team/[code]/answer
 *
 * Submit a letter to the puzzle.
 * Checks if clues are completed correctly.
 */

import { NextResponse } from "next/server";
import { getTeamState, setTeamState, addToLeaderboard } from "@/lib/daily-crossword/kv";
import { getOrGenerateDailyPuzzle } from "@/lib/daily-crossword/generate-daily";
import { normalizeTeamCode, isValidTeamCode } from "@/lib/daily-crossword/team-codes";
import { isClueCorrect } from "@/lib/crossword/generator";
import type { CrosswordClue } from "@/lib/crossword/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { sessionId, row, col, letter } = body;

    if (!sessionId || row === undefined || col === undefined) {
      return NextResponse.json(
        { error: "sessionId, row, and col are required" },
        { status: 400 }
      );
    }

    if (!isValidTeamCode(code)) {
      return NextResponse.json(
        { error: "Invalid team code format" },
        { status: 400 }
      );
    }

    const teamCode = normalizeTeamCode(code);
    const teamState = await getTeamState(teamCode);

    if (!teamState) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Already completed
    if (teamState.completedAt) {
      return NextResponse.json({
        success: true,
        answers: teamState.answers,
        correctClues: teamState.correctClues,
        completed: true,
        completedAt: teamState.completedAt,
      });
    }

    // Update member's last seen
    if (teamState.members[sessionId]) {
      teamState.members[sessionId].lastSeen = Date.now();
    }

    // Update the answer
    const cellKey = `${row},${col}`;
    if (letter === "" || letter === null) {
      delete teamState.answers[cellKey];
    } else {
      teamState.answers[cellKey] = letter.toUpperCase();
    }

    teamState.lastActivity = Date.now();

    // Get the puzzle to check correctness
    const dailyPuzzle = await getOrGenerateDailyPuzzle(
      teamState.year,
      teamState.division,
      teamState.puzzleDate
    );

    // Convert serialized clues to check correctness
    const clues = dailyPuzzle.puzzle.clues as CrosswordClue[];

    // Check which clues are now correct
    const correctClues: string[] = [];
    for (const clue of clues) {
      if (isClueCorrect(clue, teamState.answers)) {
        correctClues.push(clue.id);
      }
    }
    teamState.correctClues = correctClues;

    // Check if puzzle is complete
    const isComplete = correctClues.length === clues.length;
    if (isComplete && !teamState.completedAt) {
      teamState.completedAt = Date.now();
      teamState.completionTimeMs = teamState.completedAt - teamState.startedAt;

      // Add to leaderboard
      await addToLeaderboard(
        teamState.year,
        teamState.division,
        teamState.puzzleDate,
        {
          teamCode: teamState.teamCode,
          completionTimeMs: teamState.completionTimeMs,
          completedAt: teamState.completedAt,
          memberCount: Object.keys(teamState.members).length,
        }
      );
    }

    await setTeamState(teamState);

    return NextResponse.json({
      success: true,
      answers: teamState.answers,
      correctClues: teamState.correctClues,
      completed: isComplete,
      completedAt: teamState.completedAt,
      completionTimeMs: teamState.completionTimeMs,
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      {
        error: "Failed to submit answer",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
