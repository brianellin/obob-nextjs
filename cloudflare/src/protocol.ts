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
 * Generate a consistent color from a session ID
 * Uses a simple hash to pick from a palette of distinct colors
 */
export function getPlayerColor(sessionId: string): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FFEAA7", // Yellow
    "#DDA0DD", // Plum
    "#98D8C8", // Mint
    "#F7DC6F", // Gold
    "#BB8FCE", // Purple
    "#85C1E9", // Sky blue
  ];

  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(i);
    hash |= 0;
  }

  return colors[Math.abs(hash) % colors.length];
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
