/**
 * Cloudflare KV storage layer for Daily Crossword
 * 
 * Key patterns:
 * - team:{teamCode} -> TeamState (7 days TTL)
 * - help:{helpId} -> HelpRequest (24h TTL)
 */

// TTL values in seconds
export const TTL = {
  TEAM: 7 * 24 * 60 * 60, // 7 days
  HELP: 24 * 60 * 60, // 24 hours
} as const;

// Re-export types that the worker needs
export interface TeamMember {
  sessionId: string;
  nickname: string;
  joinedAt: number;
  lastSeen: number;
}

export interface TeamState {
  teamCode: string;
  year: string;
  division: string;
  puzzleDate: string;
  createdAt: number;
  answers: Record<string, string>;
  correctClues: string[];
  startedAt: number | null;
  completedAt: number | null;
  completionTimeMs: number | null;
  members: Record<string, TeamMember>;
  lastActivity: number;
}

export interface HelpRequest {
  helpId: string;
  teamCode: string;
  year: string;
  division: string;
  clueNumber: number;
  clueDirection: "across" | "down";
  clueText: string;
  createdAt: number;
  createdBy: string;
  answeredAt: number | null;
  answeredBy: string | null;
  answer: string | null;
}

/**
 * Team state operations
 */
export async function getTeamState(
  kv: KVNamespace,
  teamCode: string
): Promise<TeamState | null> {
  const key = `team:${teamCode.toUpperCase()}`;
  return kv.get<TeamState>(key, "json");
}

export async function setTeamState(
  kv: KVNamespace,
  teamState: TeamState
): Promise<void> {
  const key = `team:${teamState.teamCode.toUpperCase()}`;
  await kv.put(key, JSON.stringify(teamState), { expirationTtl: TTL.TEAM });
}

export async function teamCodeExists(
  kv: KVNamespace,
  teamCode: string
): Promise<boolean> {
  const key = `team:${teamCode.toUpperCase()}`;
  const value = await kv.get(key);
  return value !== null;
}

/**
 * Help request operations
 */
export async function getHelpRequest(
  kv: KVNamespace,
  helpId: string
): Promise<HelpRequest | null> {
  const key = `help:${helpId}`;
  return kv.get<HelpRequest>(key, "json");
}

export async function setHelpRequest(
  kv: KVNamespace,
  helpRequest: HelpRequest
): Promise<void> {
  const key = `help:${helpRequest.helpId}`;
  await kv.put(key, JSON.stringify(helpRequest), { expirationTtl: TTL.HELP });
}
