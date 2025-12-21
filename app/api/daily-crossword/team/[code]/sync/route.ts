/**
 * GET /api/daily-crossword/team/[code]/sync
 *
 * Long-polling endpoint for real-time updates.
 * Holds the connection for up to 25 seconds waiting for changes.
 */

import { NextResponse } from "next/server";
import { getTeamState, setTeamState } from "@/lib/daily-crossword/kv";
import { normalizeTeamCode, isValidTeamCode } from "@/lib/daily-crossword/team-codes";
import type { SyncResponse, TeamMember } from "@/lib/daily-crossword/types";

const MAX_WAIT_MS = 25000; // 25 seconds max hold
const POLL_INTERVAL_MS = 500; // Check every 500ms

/**
 * Filter out stale cursors and exclude current session
 */
function filterActiveMembers(
  members: Record<string, TeamMember>,
  currentSessionId?: string,
  maxAgeMs: number = 30000 // 30 seconds
): Record<string, TeamMember> {
  const now = Date.now();
  const filtered: Record<string, TeamMember> = {};

  for (const [sessionId, member] of Object.entries(members)) {
    // Exclude current session
    if (sessionId === currentSessionId) continue;

    // Exclude stale members
    if (now - member.lastSeen > maxAgeMs) continue;

    filtered[sessionId] = member;
  }

  return filtered;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const { searchParams } = new URL(request.url);
    const lastUpdate = parseInt(searchParams.get("lastUpdate") || "0", 10);
    const sessionId = searchParams.get("sessionId") || undefined;

    if (!isValidTeamCode(code)) {
      return NextResponse.json(
        { error: "Invalid team code format" },
        { status: 400 }
      );
    }

    const teamCode = normalizeTeamCode(code);
    const startTime = Date.now();

    // Update this session's last seen time if provided
    if (sessionId) {
      const teamState = await getTeamState(teamCode);
      if (teamState && teamState.members[sessionId]) {
        teamState.members[sessionId].lastSeen = Date.now();
        await setTeamState(teamState);
      }
    }

    // Long poll: wait for changes
    while (Date.now() - startTime < MAX_WAIT_MS) {
      const teamState = await getTeamState(teamCode);

      if (!teamState) {
        return NextResponse.json({ error: "Team not found" }, { status: 404 });
      }

      // Check if there are updates since lastUpdate
      if (teamState.lastActivity > lastUpdate) {
        const response: SyncResponse = {
          answers: teamState.answers,
          correctClues: teamState.correctClues,
          members: filterActiveMembers(teamState.members, sessionId),
          completed: teamState.completedAt !== null,
          completedAt: teamState.completedAt,
          timestamp: teamState.lastActivity,
        };

        return NextResponse.json(response);
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    // Timeout: return current state
    const teamState = await getTeamState(teamCode);
    if (!teamState) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const response: SyncResponse = {
      answers: teamState.answers,
      correctClues: teamState.correctClues,
      members: filterActiveMembers(teamState.members, sessionId),
      completed: teamState.completedAt !== null,
      completedAt: teamState.completedAt,
      timestamp: Date.now(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in sync:", error);
    return NextResponse.json(
      {
        error: "Failed to sync",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
