/**
 * GET /api/daily-crossword/team/[code]
 *
 * Get the current state of a team.
 */

import { NextResponse } from "next/server";
import { getTeamState } from "@/lib/daily-crossword/kv";
import { normalizeTeamCode, isValidTeamCode } from "@/lib/daily-crossword/team-codes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!isValidTeamCode(code)) {
      return NextResponse.json(
        { error: "Invalid team code format" },
        { status: 400 }
      );
    }

    const teamCode = normalizeTeamCode(code);
    const teamState = await getTeamState(teamCode);

    if (!teamState) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      teamState,
    });
  } catch (error) {
    console.error("Error getting team state:", error);
    return NextResponse.json(
      {
        error: "Failed to get team state",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
