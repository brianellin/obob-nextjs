/**
 * Types for the Daily Collaborative Crossword feature
 */

import type { CrosswordClue } from "../crossword/types";

/**
 * Serialized version of CrosswordPuzzle for JSON storage
 * (Maps are converted to Records)
 */
export interface SerializedCrosswordPuzzle {
  grid: (string | null)[][];
  clues: CrosswordClue[];
  rows: number;
  cols: number;
  cellNumbers: Record<string, number>; // "row,col" -> number
}

/**
 * A daily puzzle stored in KV
 */
export interface DailyPuzzle {
  id: string; // "{year}:{division}:{dateString}"
  year: string;
  division: string;
  dateString: string; // "2025-01-15" in PT
  puzzle: SerializedCrosswordPuzzle;
  generatedAt: number; // Unix timestamp
  clueCount: number;
}

/**
 * A team member in a collaborative session
 */
export interface TeamMember {
  sessionId: string;
  nickname: string; // Auto-generated: "Blue Pup"
  joinedAt: number;
  lastSeen: number;
}

/**
 * Team state stored in KV
 */
export interface TeamState {
  teamCode: string; // "BARK42"
  year: string;
  division: string;
  puzzleDate: string; // "2025-01-15"
  createdAt: number;

  // Puzzle progress
  answers: Record<string, string>; // "row,col" -> letter
  correctClues: string[]; // Clue IDs that are correct

  // Completion tracking
  startedAt: number;
  completedAt: number | null;
  completionTimeMs: number | null;

  // Team members
  members: Record<string, TeamMember>; // sessionId -> member

  // For sync tracking
  lastActivity: number;
}

/**
 * A help request for a specific clue
 */
export interface HelpRequest {
  helpId: string; // Short unique ID like "h7x9k2"
  teamCode: string;
  clueId: string;
  clueNumber: number;
  clueDirection: "across" | "down";
  clueText: string;
  bookTitle: string;
  bookKey: string;
  page: number | undefined;
  createdAt: number;
  answeredAt: number | null;
  answer: string | null; // Submitted answer (if any)
}

/**
 * Leaderboard entry for a completed team
 */
export interface LeaderboardEntry {
  teamCode: string;
  completionTimeMs: number;
  completedAt: number;
  memberCount: number;
  rank?: number;
}

/**
 * Response from team sync endpoint
 */
export interface SyncResponse {
  answers: Record<string, string>;
  correctClues: string[];
  members: Record<string, TeamMember>;
  completed: boolean;
  completedAt: number | null;
  timestamp: number;
}

/**
 * Request to create or join a team
 */
export interface TeamActionRequest {
  action: "create" | "join";
  year: string;
  division: string;
  teamCode?: string; // Required for join
  sessionId: string;
}

/**
 * Response from team create/join
 */
export interface TeamActionResponse {
  success: boolean;
  teamCode: string;
  teamState: TeamState;
  nickname: string; // The nickname assigned to this session
  error?: string;
}
