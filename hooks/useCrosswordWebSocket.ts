"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * WebSocket Protocol Types (mirrored from cloudflare/src/protocol.ts)
 */

export interface Player {
  sessionId: string;
  nickname: string;
  color: string;
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
  answers: Record<string, string>;
  correctClues: string[];
  startedAt: number;
  completedAt: number | null;
}

type ServerMessage =
  | {
      type: "init";
      state: GameState;
      players: Player[];
      you: { sessionId: string; nickname: string; color: string };
    }
  | {
      type: "cursor_update";
      sessionId: string;
      nickname: string;
      color: string;
      row: number;
      col: number;
      direction: "across" | "down";
    }
  | {
      type: "letter_update";
      row: number;
      col: number;
      letter: string;
      sessionId: string;
    }
  | {
      type: "delete_update";
      row: number;
      col: number;
      sessionId: string;
    }
  | { type: "correct_clue"; clueId: string }
  | { type: "complete"; completedAt: number; completionTimeMs: number }
  | {
      type: "presence";
      action: "join" | "leave";
      sessionId: string;
      nickname: string;
      color: string;
      playerCount: number;
    }
  | { type: "pong"; timestamp: number }
  | { type: "error"; message: string; code?: string };

interface UseCrosswordWebSocketOptions {
  wsUrl: string;
  teamCode: string;
  sessionId: string;
  nickname: string;
  year: string;
  division: string;
  puzzleDate: string;
  onLetterUpdate?: (row: number, col: number, letter: string, sessionId: string) => void;
  onDeleteUpdate?: (row: number, col: number, sessionId: string) => void;
  onCorrectClue?: (clueId: string) => void;
  onComplete?: (completedAt: number, completionTimeMs: number) => void;
  onPresence?: (action: "join" | "leave", nickname: string) => void;
  onError?: (message: string) => void;
}

interface UseCrosswordWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  players: Map<string, Player>;
  myColor: string;
  gameState: GameState | null;
  sendLetter: (row: number, col: number, letter: string) => void;
  sendDelete: (row: number, col: number) => void;
  sendCursor: (row: number, col: number, direction: "across" | "down") => void;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const PING_INTERVAL = 30000;

export function useCrosswordWebSocket(
  options: UseCrosswordWebSocketOptions
): UseCrosswordWebSocketReturn {
  const {
    wsUrl,
    teamCode,
    sessionId,
    nickname,
    year,
    division,
    puzzleDate,
    onLetterUpdate,
    onDeleteUpdate,
    onCorrectClue,
    onComplete,
    onPresence,
    onError,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [players, setPlayers] = useState<Map<string, Player>>(new Map());
  const [myColor, setMyColor] = useState("#4ECDC4");
  const [gameState, setGameState] = useState<GameState | null>(null);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);

    const fullUrl = `${wsUrl}/room/${teamCode}`;
    const ws = new WebSocket(fullUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setIsConnecting(false);
      reconnectAttemptRef.current = 0;

      // Send join message
      ws.send(
        JSON.stringify({
          type: "join",
          teamCode,
          sessionId,
          nickname,
          year,
          division,
          puzzleDate,
        })
      );

      // Start ping interval
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, PING_INTERVAL);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        handleMessage(msg);
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsConnecting(false);
      wsRef.current = null;

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Attempt reconnect with exponential backoff (only if still mounted)
      if (isMountedRef.current) {
        const delay =
          RECONNECT_DELAYS[
            Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)
          ];
        reconnectAttemptRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = () => {
      // Errors are usually followed by onclose, so we don't need to handle much here
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl, teamCode, sessionId, nickname, year, division, puzzleDate]);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "init":
          setGameState(msg.state);
          setMyColor(msg.you.color);
          const playerMap = new Map<string, Player>();
          for (const player of msg.players) {
            playerMap.set(player.sessionId, player);
          }
          setPlayers(playerMap);
          break;

        case "cursor_update":
          setPlayers((prev) => {
            const next = new Map(prev);
            const existing = next.get(msg.sessionId);
            next.set(msg.sessionId, {
              ...existing,
              sessionId: msg.sessionId,
              nickname: msg.nickname,
              color: msg.color,
              cursor: { row: msg.row, col: msg.col, direction: msg.direction },
              lastSeen: Date.now(),
            });
            return next;
          });
          break;

        case "letter_update":
          setGameState((prev) => {
            if (!prev) return prev;
            const key = `${msg.row},${msg.col}`;
            return {
              ...prev,
              answers: { ...prev.answers, [key]: msg.letter },
            };
          });
          onLetterUpdate?.(msg.row, msg.col, msg.letter, msg.sessionId);
          break;

        case "delete_update":
          setGameState((prev) => {
            if (!prev) return prev;
            const key = `${msg.row},${msg.col}`;
            const { [key]: _, ...rest } = prev.answers;
            return { ...prev, answers: rest };
          });
          onDeleteUpdate?.(msg.row, msg.col, msg.sessionId);
          break;

        case "correct_clue":
          setGameState((prev) => {
            if (!prev) return prev;
            if (prev.correctClues.includes(msg.clueId)) return prev;
            return {
              ...prev,
              correctClues: [...prev.correctClues, msg.clueId],
            };
          });
          onCorrectClue?.(msg.clueId);
          break;

        case "complete":
          setGameState((prev) => {
            if (!prev) return prev;
            return { ...prev, completedAt: msg.completedAt };
          });
          onComplete?.(msg.completedAt, msg.completionTimeMs);
          break;

        case "presence":
          if (msg.action === "join") {
            setPlayers((prev) => {
              const next = new Map(prev);
              next.set(msg.sessionId, {
                sessionId: msg.sessionId,
                nickname: msg.nickname,
                color: msg.color,
                cursor: null,
                lastSeen: Date.now(),
              });
              return next;
            });
          } else {
            setPlayers((prev) => {
              const next = new Map(prev);
              next.delete(msg.sessionId);
              return next;
            });
          }
          onPresence?.(msg.action, msg.nickname);
          break;

        case "error":
          console.error("Server error:", msg.message);
          onError?.(msg.message);
          break;

        case "pong":
          // Connection is alive
          break;
      }
    },
    [onLetterUpdate, onDeleteUpdate, onCorrectClue, onComplete, onPresence, onError]
  );

  // Connect on mount
  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendLetter = useCallback((row: number, col: number, letter: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "letter", row, col, letter }));
    }
  }, []);

  const sendDelete = useCallback((row: number, col: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "delete", row, col }));
    }
  }, []);

  const sendCursor = useCallback(
    (row: number, col: number, direction: "across" | "down") => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "cursor", row, col, direction }));
      }
    },
    []
  );

  return {
    isConnected,
    isConnecting,
    players,
    myColor,
    gameState,
    sendLetter,
    sendDelete,
    sendCursor,
  };
}
