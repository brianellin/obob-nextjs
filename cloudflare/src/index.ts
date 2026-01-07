/**
 * Cloudflare Worker Entry Point
 *
 * Routes requests to the appropriate CrosswordRoom Durable Object
 * based on the team code in the URL.
 * 
 * Also handles team create/join API endpoints using Cloudflare KV.
 */

import { CrosswordRoom } from "./crossword-room";
import { getTeamState, setTeamState, teamCodeExists, TeamState, TeamMember } from "./kv";
import { generateTeamCode, generateNickname, isValidTeamCode, normalizeTeamCode } from "./team-codes";

export { CrosswordRoom };

interface Env {
  CROSSWORD_ROOM: DurableObjectNamespace;
  CROSSWORD_KV: KVNamespace;
  PUZZLE_API_URL: string;
}

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol",
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

/**
 * Get today's puzzle date in Pacific timezone
 */
function getTodaysPuzzleDate(): string {
  const now = new Date();
  const pacific = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const year = pacific.getFullYear();
  const month = String(pacific.getMonth() + 1).padStart(2, "0");
  const day = String(pacific.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Handle team creation
 */
async function handleCreateTeam(
  env: Env,
  year: string,
  division: string,
  sessionId: string
): Promise<Response> {
  const teamCode = await generateTeamCode(env.CROSSWORD_KV, teamCodeExists);
  const puzzleDate = getTodaysPuzzleDate();
  const now = Date.now();
  const nickname = generateNickname([]);

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
    members: {
      [sessionId]: {
        sessionId,
        nickname,
        joinedAt: now,
        lastSeen: now,
      },
    },
    lastActivity: now,
  };

  await setTeamState(env.CROSSWORD_KV, teamState);

  return jsonResponse({
    success: true,
    teamCode,
    teamState,
    nickname,
  });
}

/**
 * Handle joining an existing team
 */
async function handleJoinTeam(
  env: Env,
  inputCode: string,
  year: string,
  division: string,
  sessionId: string
): Promise<Response> {
  if (!isValidTeamCode(inputCode)) {
    return jsonResponse({ error: "Invalid team code format" }, 400);
  }

  const teamCode = normalizeTeamCode(inputCode);
  const existingTeam = await getTeamState(env.CROSSWORD_KV, teamCode);

  if (!existingTeam) {
    return jsonResponse({ error: "Team not found. Check the code and try again." }, 404);
  }

  // Verify same year/division
  if (existingTeam.year !== year || existingTeam.division !== division) {
    return jsonResponse({
      error: `This team is for ${existingTeam.year} ${existingTeam.division}. You're trying to join ${year} ${division}.`,
    }, 400);
  }

  // Check if session already in team
  let nickname: string;
  const existingMember = existingTeam.members[sessionId];

  if (existingMember) {
    nickname = existingMember.nickname;
    existingMember.lastSeen = Date.now();
  } else {
    const existingNicknames = Object.values(existingTeam.members).map((m) => m.nickname);
    nickname = generateNickname(existingNicknames);
    const now = Date.now();
    existingTeam.members[sessionId] = {
      sessionId,
      nickname,
      joinedAt: now,
      lastSeen: now,
    };
  }

  existingTeam.lastActivity = Date.now();
  await setTeamState(env.CROSSWORD_KV, existingTeam);

  return jsonResponse({
    success: true,
    teamCode,
    teamState: existingTeam,
    nickname,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      return jsonResponse({ status: "ok", service: "obob-crossword-realtime" });
    }

    // ========================================
    // Team API endpoints
    // ========================================

    // POST /api/team - Create or join a team
    if (url.pathname === "/api/team" && request.method === "POST") {
      try {
        const body = await request.json() as {
          action: "create" | "join";
          year: string;
          division: string;
          sessionId: string;
          teamCode?: string;
        };

        const { action, year, division, sessionId, teamCode } = body;

        if (!year || !division || !sessionId) {
          return jsonResponse({ error: "Missing required fields: year, division, sessionId" }, 400);
        }

        if (action === "create") {
          return handleCreateTeam(env, year, division, sessionId);
        } else if (action === "join") {
          if (!teamCode) {
            return jsonResponse({ error: "teamCode is required to join a team" }, 400);
          }
          return handleJoinTeam(env, teamCode, year, division, sessionId);
        } else {
          return jsonResponse({ error: "Invalid action. Use 'create' or 'join'" }, 400);
        }
      } catch (e) {
        console.error("Team API error:", e);
        return jsonResponse({ error: "Invalid request body" }, 400);
      }
    }

    // GET /api/team/:code - Get team state
    if (url.pathname.startsWith("/api/team/") && request.method === "GET") {
      const code = url.pathname.replace("/api/team/", "");
      if (!isValidTeamCode(code)) {
        return jsonResponse({ error: "Invalid team code format" }, 400);
      }

      const teamState = await getTeamState(env.CROSSWORD_KV, normalizeTeamCode(code));
      if (!teamState) {
        return jsonResponse({ error: "Team not found" }, 404);
      }

      return jsonResponse(teamState);
    }

    // ========================================
    // Room (WebSocket) endpoints
    // ========================================

    // Route: /room/:teamCode
    const roomMatch = url.pathname.match(/^\/room\/([A-Z0-9-]+)$/i);
    if (roomMatch) {
      const teamCode = roomMatch[1].toUpperCase();
      console.log(`[Worker] Room request for ${teamCode}, upgrade: ${request.headers.get("Upgrade")}`);

      if (!/^[A-Z]{2,8}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4,6}$/.test(teamCode)) {
        console.log(`[Worker] Invalid team code: ${teamCode}`);
        return jsonResponse({ error: "Invalid team code format" }, 400);
      }

      // Get or create the Durable Object for this room
      const id = env.CROSSWORD_ROOM.idFromName(`room:${teamCode}`);
      const room = env.CROSSWORD_ROOM.get(id);

      console.log(`[Worker] Forwarding to Durable Object`);
      const response = await room.fetch(request);
      console.log(`[Worker] DO response status: ${response.status}`);

      // Add CORS headers for non-WebSocket responses
      if (request.headers.get("Upgrade") !== "websocket") {
        const newHeaders = new Headers(response.headers);
        for (const [key, value] of Object.entries(corsHeaders)) {
          newHeaders.set(key, value);
        }
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }

      return response;
    }

    // Route: /rooms (debugging)
    if (url.pathname === "/rooms" && request.method === "GET") {
      return jsonResponse({ message: "Room listing not available" }, 501);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
