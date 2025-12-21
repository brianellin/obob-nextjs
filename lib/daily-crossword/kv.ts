/**
 * KV storage abstraction for Daily Crossword
 *
 * Uses Vercel KV (Redis) in production.
 * Falls back to in-memory storage for development.
 *
 * Key patterns:
 * - puzzle:{year}:{division}:{dateString} -> DailyPuzzle (48h TTL)
 * - team:{teamCode} -> TeamState (7 days TTL)
 * - help:{helpId} -> HelpRequest (24h TTL)
 * - leaderboard:{year}:{division}:{dateString} -> LeaderboardEntry[] (48h TTL)
 */

import type { DailyPuzzle, TeamState, HelpRequest, LeaderboardEntry } from "./types";

// TTL values in seconds
const TTL = {
  PUZZLE: 48 * 60 * 60, // 48 hours
  TEAM: 7 * 24 * 60 * 60, // 7 days
  HELP: 24 * 60 * 60, // 24 hours
  LEADERBOARD: 48 * 60 * 60, // 48 hours
} as const;

// In-memory fallback for development
const memoryStore = new Map<string, { value: string; expiry: number | null }>();

/**
 * Check if Vercel KV is available
 */
function isVercelKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get a value from KV
 */
async function get<T>(key: string): Promise<T | null> {
  if (isVercelKVAvailable()) {
    const { kv } = await import("@vercel/kv");
    return kv.get<T>(key);
  }

  // Fallback to memory store
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiry && Date.now() > entry.expiry) {
    memoryStore.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

/**
 * Set a value in KV with optional TTL
 */
async function set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  if (isVercelKVAvailable()) {
    const { kv } = await import("@vercel/kv");
    if (ttlSeconds) {
      await kv.set(key, value, { ex: ttlSeconds });
    } else {
      await kv.set(key, value);
    }
    return;
  }

  // Fallback to memory store
  memoryStore.set(key, {
    value: JSON.stringify(value),
    expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

/**
 * Delete a value from KV
 */
async function del(key: string): Promise<void> {
  if (isVercelKVAvailable()) {
    const { kv } = await import("@vercel/kv");
    await kv.del(key);
    return;
  }

  memoryStore.delete(key);
}

/**
 * Check if a key exists
 */
async function exists(key: string): Promise<boolean> {
  if (isVercelKVAvailable()) {
    const { kv } = await import("@vercel/kv");
    return (await kv.exists(key)) > 0;
  }

  const entry = memoryStore.get(key);
  if (!entry) return false;
  if (entry.expiry && Date.now() > entry.expiry) {
    memoryStore.delete(key);
    return false;
  }
  return true;
}

// ============================================
// Domain-specific helpers
// ============================================

/**
 * Get the daily puzzle for a year/division/date
 */
export async function getDailyPuzzle(
  year: string,
  division: string,
  dateString: string
): Promise<DailyPuzzle | null> {
  const key = `puzzle:${year}:${division}:${dateString}`;
  return get<DailyPuzzle>(key);
}

/**
 * Save a daily puzzle
 */
export async function setDailyPuzzle(puzzle: DailyPuzzle): Promise<void> {
  const key = `puzzle:${puzzle.year}:${puzzle.division}:${puzzle.dateString}`;
  await set(key, puzzle, TTL.PUZZLE);
}

/**
 * Get team state by code
 */
export async function getTeamState(teamCode: string): Promise<TeamState | null> {
  const key = `team:${teamCode.toUpperCase()}`;
  return get<TeamState>(key);
}

/**
 * Save team state
 */
export async function setTeamState(teamState: TeamState): Promise<void> {
  const key = `team:${teamState.teamCode.toUpperCase()}`;
  await set(key, teamState, TTL.TEAM);
}

/**
 * Check if a team code exists
 */
export async function teamCodeExists(teamCode: string): Promise<boolean> {
  const key = `team:${teamCode.toUpperCase()}`;
  return exists(key);
}

/**
 * Get help request by ID
 */
export async function getHelpRequest(helpId: string): Promise<HelpRequest | null> {
  const key = `help:${helpId}`;
  return get<HelpRequest>(key);
}

/**
 * Save help request
 */
export async function setHelpRequest(helpRequest: HelpRequest): Promise<void> {
  const key = `help:${helpRequest.helpId}`;
  await set(key, helpRequest, TTL.HELP);
}

/**
 * Get leaderboard for a day
 */
export async function getLeaderboard(
  year: string,
  division: string,
  dateString: string
): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${year}:${division}:${dateString}`;
  return (await get<LeaderboardEntry[]>(key)) || [];
}

/**
 * Add a team to the leaderboard
 */
export async function addToLeaderboard(
  year: string,
  division: string,
  dateString: string,
  entry: LeaderboardEntry
): Promise<void> {
  const key = `leaderboard:${year}:${division}:${dateString}`;
  const current = await getLeaderboard(year, division, dateString);

  // Check if team already on leaderboard
  const existingIndex = current.findIndex((e) => e.teamCode === entry.teamCode);
  if (existingIndex >= 0) {
    // Update if better time
    if (entry.completionTimeMs < current[existingIndex].completionTimeMs) {
      current[existingIndex] = entry;
    }
  } else {
    current.push(entry);
  }

  // Sort by completion time and assign ranks
  current.sort((a, b) => a.completionTimeMs - b.completionTimeMs);
  current.forEach((e, i) => {
    e.rank = i + 1;
  });

  await set(key, current, TTL.LEADERBOARD);
}

/**
 * Clear the in-memory store (for testing)
 */
export function clearMemoryStore(): void {
  memoryStore.clear();
}
