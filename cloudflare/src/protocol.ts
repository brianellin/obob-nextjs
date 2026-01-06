/**
 * WebSocket Protocol for Real-time Crossword Collaboration
 *
 * This defines all message types exchanged between clients and the Durable Object.
 */

// =============================================================================
// Client -> Server Messages
// =============================================================================

export interface JoinMessage {
  type: "join";
  teamCode: string;
  sessionId: string;
  nickname: string;
  year: string;
  division: string;
  puzzleDate: string;
}

export interface CursorMessage {
  type: "cursor";
  row: number;
  col: number;
  direction: "across" | "down";
}

export interface LetterMessage {
  type: "letter";
  row: number;
  col: number;
  letter: string; // Single uppercase letter or empty string for delete
}

export interface DeleteMessage {
  type: "delete";
  row: number;
  col: number;
}

export interface PingMessage {
  type: "ping";
}

export type ClientMessage =
  | JoinMessage
  | CursorMessage
  | LetterMessage
  | DeleteMessage
  | PingMessage;

// =============================================================================
// Server -> Client Messages
// =============================================================================

export interface Player {
  sessionId: string;
  nickname: string;
  color: string; // Hex color for cursor display
  cursor: {
    row: number;
    col: number;
    direction: "across" | "down";
  } | null;
  lastSeen: number;
}

export interface GameState {
  teamCode: string;
  year: string;
  division: string;
  puzzleDate: string;
  answers: Record<string, string>; // "row,col" -> letter
  correctClues: string[]; // Clue IDs that have been completed
  startedAt: number;
  completedAt: number | null;
}

export interface InitMessage {
  type: "init";
  state: GameState;
  players: Player[];
  you: {
    sessionId: string;
    nickname: string;
    color: string;
  };
}

export interface CursorUpdateMessage {
  type: "cursor_update";
  sessionId: string;
  nickname: string;
  color: string;
  row: number;
  col: number;
  direction: "across" | "down";
}

export interface LetterUpdateMessage {
  type: "letter_update";
  row: number;
  col: number;
  letter: string;
  sessionId: string; // Who placed it
}

export interface DeleteUpdateMessage {
  type: "delete_update";
  row: number;
  col: number;
  sessionId: string;
}

export interface CorrectClueMessage {
  type: "correct_clue";
  clueId: string;
}

export interface CompleteMessage {
  type: "complete";
  completedAt: number;
  completionTimeMs: number;
}

export interface PresenceMessage {
  type: "presence";
  action: "join" | "leave";
  sessionId: string;
  nickname: string;
  color: string;
  playerCount: number;
}

export interface PongMessage {
  type: "pong";
  timestamp: number;
}

export interface ErrorMessage {
  type: "error";
  message: string;
  code?: string;
}

export type ServerMessage =
  | InitMessage
  | CursorUpdateMessage
  | LetterUpdateMessage
  | DeleteUpdateMessage
  | CorrectClueMessage
  | CompleteMessage
  | PresenceMessage
  | PongMessage
  | ErrorMessage;

// =============================================================================
// Helpers
// =============================================================================

/**
 * Map of color names used in nicknames to their hex values
 * These match the COLORS array in team-codes.ts
 */
const NICKNAME_COLORS: Record<string, string> = {
  blue: "#1E88E5",
  red: "#E53935",
  green: "#43A047",
  purple: "#8E24AA",
  orange: "#F4511E",
  pink: "#D81B60",
  teal: "#00897B",
  gold: "#FFA000",
  silver: "#78909C",
  coral: "#FF7043",
  mint: "#26A69A",
  peach: "#FF8A65",
  indigo: "#3949AB",
  crimson: "#C62828",
  emerald: "#00C853",
  amber: "#FFB300",
};

/**
 * Generate a color from a nickname
 * Extracts the color word from nicknames like "Blue Pup" or "Green Corgi"
 * Falls back to hash-based color if no color word found
 */
export function getPlayerColor(nickname: string): string {
  // Extract first word (the color) from nickname
  const firstWord = nickname.split(" ")[0]?.toLowerCase();
  
  if (firstWord && NICKNAME_COLORS[firstWord]) {
    return NICKNAME_COLORS[firstWord];
  }

  // Fallback: hash-based color for legacy/unknown nicknames
  const fallbackColors = Object.values(NICKNAME_COLORS);
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = (hash << 5) - hash + nickname.charCodeAt(i);
    hash |= 0;
  }

  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}

/**
 * Parse a cell key into row and column
 */
export function parseCellKey(key: string): { row: number; col: number } {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

/**
 * Create a cell key from row and column
 */
export function makeCellKey(row: number, col: number): string {
  return `${row},${col}`;
}
