/**
 * POST /api/daily-crossword/team
 *
 * Create or join a team for the daily crossword.
 *
 * Actions:
 * - create: Generate a new team code and initialize team state
 * - join: Join an existing team with a code
 */

import { NextResponse } from "next/server";
import { getTeamState, setTeamState } from "@/lib/daily-crossword/kv";
import {
  generateTeamCode,
  generateNickname,
  isValidTeamCode,
  normalizeTeamCode,
  getCursorColor,
} from "@/lib/daily-crossword/team-codes";
import { getTodaysPuzzleDate } from "@/lib/daily-crossword/generate-daily";
import type { TeamState, TeamMember, TeamActionResponse } from "@/lib/daily-crossword/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, year, division, teamCode: inputCode, sessionId } = body;

    if (!action || !year || !division || !sessionId) {
      return NextResponse.json(
        { error: "action, year, division, and sessionId are required" },
        { status: 400 }
      );
    }

    if (action !== "create" && action !== "join") {
      return NextResponse.json(
        { error: 'action must be "create" or "join"' },
        { status: 400 }
      );
    }

    const puzzleDate = getTodaysPuzzleDate();

    if (action === "create") {
      // Create a new team
      const teamCode = await generateTeamCode();
      const nickname = generateNickname([]);

      const now = Date.now();
      const member: TeamMember = {
        sessionId,
        nickname,
        joinedAt: now,
        lastSeen: now,
      };

      const teamState: TeamState = {
        teamCode,
        year,
        division,
        puzzleDate,
        createdAt: now,
        answers: {},
        correctClues: [],
        startedAt: now,
        completedAt: null,
        completionTimeMs: null,
        members: { [sessionId]: member },
        lastActivity: now,
      };

      await setTeamState(teamState);

      const response: TeamActionResponse = {
        success: true,
        teamCode,
        teamState,
        nickname,
      };

      return NextResponse.json(response);
    } else {
      // Join an existing team
      if (!inputCode) {
        return NextResponse.json(
          { error: "teamCode is required to join a team" },
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
      const existingTeam = await getTeamState(teamCode);

      if (!existingTeam) {
        return NextResponse.json(
          { error: "Team not found. Check the code and try again." },
          { status: 404 }
        );
      }

      // Verify the team is for the same year/division
      if (existingTeam.year !== year || existingTeam.division !== division) {
        return NextResponse.json(
          {
            error: `This team is for ${existingTeam.year} ${existingTeam.division}. You're trying to join ${year} ${division}.`,
          },
          { status: 400 }
        );
      }

      // Check if session already in team
      let nickname: string;
      const existingMember = existingTeam.members[sessionId];

      if (existingMember) {
        // Already in team, update last seen
        nickname = existingMember.nickname;
        existingTeam.members[sessionId].lastSeen = Date.now();
      } else {
        // New member - generate nickname
        const existingNicknames = Object.values(existingTeam.members).map(
          (m) => m.nickname
        );
        nickname = generateNickname(existingNicknames);

        const now = Date.now();
        const member: TeamMember = {
          sessionId,
          nickname,
          joinedAt: now,
          lastSeen: now,
        };
        existingTeam.members[sessionId] = member;
      }

      existingTeam.lastActivity = Date.now();
      await setTeamState(existingTeam);

      const response: TeamActionResponse = {
        success: true,
        teamCode,
        teamState: existingTeam,
        nickname,
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Error in team action:", error);
    return NextResponse.json(
      {
        error: "Failed to process team action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
