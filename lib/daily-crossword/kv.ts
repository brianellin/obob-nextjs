/**
 * KV storage abstraction for Daily Crossword
 *
 * This module proxies to Cloudflare KV via the Worker API.
 * Team state is stored in Cloudflare KV, accessed through the Worker.
 * 
 * Note: With the realtime WebSocket architecture, most KV operations
 * happen directly in the Cloudflare Worker. These functions are mainly
 * used for initial team creation/lookup from the Next.js app.
 */

import type { TeamState, HelpRequest, LeaderboardEntry } from "./types";

const CLOUDFLARE_API_URL = process.env.NEXT_PUBLIC_CROSSWORD_WS_URL?.replace("wss://", "https://").replace("ws://", "http://") || "http://localhost:8787";

/**
 * Get team state by code (via Cloudflare Worker)
 */
export async function getTeamState(teamCode: string): Promise<TeamState | null> {
  try {
    const response = await fetch(`${CLOUDFLARE_API_URL}/api/team/${teamCode.toUpperCase()}`);
    if (!response.ok) {
      return null;
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching team state from Cloudflare:", error);
    return null;
  }
}

/**
 * Check if a team code exists (via Cloudflare Worker)
 */
export async function teamCodeExists(teamCode: string): Promise<boolean> {
  const state = await getTeamState(teamCode);
  return state !== null;
}

// ============================================
// The following are no longer used with the 
// Cloudflare-based architecture, but kept for 
// backwards compatibility if needed.
// ============================================

export async function setTeamState(teamState: TeamState): Promise<void> {
  console.warn("setTeamState called from Next.js - this should be handled by Cloudflare Worker");
}

export async function getHelpRequest(helpId: string): Promise<HelpRequest | null> {
  console.warn("Help requests should be migrated to Cloudflare KV");
  return null;
}

export async function setHelpRequest(helpRequest: HelpRequest): Promise<void> {
  console.warn("Help requests should be migrated to Cloudflare KV");
}

export async function getLeaderboard(
  year: string,
  division: string,
  dateString: string
): Promise<LeaderboardEntry[]> {
  console.warn("Leaderboard should be migrated to Cloudflare KV");
  return [];
}

export async function addToLeaderboard(
  year: string,
  division: string,
  dateString: string,
  entry: LeaderboardEntry
): Promise<void> {
  console.warn("Leaderboard should be migrated to Cloudflare KV");
}

export function clearMemoryStore(): void {
  // No-op, memory store removed
}
