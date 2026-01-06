/**
 * CrosswordRoom Durable Object
 *
 * Manages a single collaborative crossword room with:
 * - WebSocket connections for all players
 * - Game state (answers, correct clues, completion)
 * - Cursor/presence tracking
 * - Real-time broadcasting
 */

import {
  type ClientMessage,
  type ServerMessage,
  type Player,
  type GameState,
  getPlayerColor,
  makeCellKey,
} from "./protocol";

interface StoredState {
  teamCode: string;
  year: string;
  division: string;
  puzzleDate: string;
  answers: Record<string, string>;
  correctClues: string[];
  startedAt: number;
  completedAt: number | null;
}

interface ClientMetadata {
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

export class CrosswordRoom {
  private state: DurableObjectState;
  private env: Env;
  private gameState: StoredState | null = null;
  private puzzleClues: Map<string, PuzzleClue> | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  private getClientMetadata(ws: WebSocket): ClientMetadata | null {
    return ws.deserializeAttachment() as ClientMetadata | null;
  }

  private setClientMetadata(ws: WebSocket, meta: ClientMetadata): void {
    ws.serializeAttachment(meta);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    console.log(`[DO] fetch called, upgrade: ${request.headers.get("Upgrade")}`);

    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      console.log(`[DO] Handling WebSocket upgrade`);
      return this.handleWebSocketUpgrade(request);
    }

    // Handle HTTP endpoints for state inspection (optional)
    if (url.pathname === "/state") {
      const state = await this.getGameState();
      return new Response(JSON.stringify(state), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket with hibernation support
    this.state.acceptWebSocket(server);

    // Initialize with empty metadata (will be filled on "join" message)
    const initialMeta: ClientMetadata = {
      sessionId: "",
      nickname: "",
      color: "",
      cursor: null,
      lastSeen: Date.now(),
    };

    this.setClientMetadata(server, initialMeta);

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    const client = this.getClientMetadata(ws);
    if (!client) return;

    try {
      const msg: ClientMessage = JSON.parse(message);
      await this.handleMessage(ws, client, msg);
    } catch (err) {
      console.error("Failed to handle message:", err);
      this.send(ws, { type: "error", message: "Invalid message format" });
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    const client = this.getClientMetadata(ws);
    if (client && client.sessionId) {
      const allSockets = this.state.getWebSockets();
      this.broadcast(
        {
          type: "presence",
          action: "leave",
          sessionId: client.sessionId,
          nickname: client.nickname,
          color: client.color,
          playerCount: allSockets.length - 1,
        },
        ws
      );
    }
  }

  async webSocketError(ws: WebSocket, error: unknown) {
    console.error("WebSocket error:", error);
    const client = this.getClientMetadata(ws);
    if (client && client.sessionId) {
      const allSockets = this.state.getWebSockets();
      this.broadcast(
        {
          type: "presence",
          action: "leave",
          sessionId: client.sessionId,
          nickname: client.nickname,
          color: client.color,
          playerCount: allSockets.length - 1,
        },
        ws
      );
    }
  }

  private async handleMessage(
    ws: WebSocket,
    client: ClientMetadata,
    msg: ClientMessage
  ) {
    switch (msg.type) {
      case "join":
        await this.handleJoin(ws, client, msg);
        break;
      case "cursor":
        this.handleCursor(ws, client, msg);
        break;
      case "letter":
        await this.handleLetter(ws, client, msg);
        break;
      case "delete":
        await this.handleDelete(ws, client, msg);
        break;
      case "ping":
        client.lastSeen = Date.now();
        this.setClientMetadata(ws, client);
        this.send(ws, { type: "pong", timestamp: Date.now() });
        break;
    }
  }

  private async handleJoin(
    ws: WebSocket,
    client: ClientMetadata,
    msg: {
      type: "join";
      teamCode: string;
      sessionId: string;
      nickname: string;
      year: string;
      division: string;
      puzzleDate: string;
    }
  ) {
    // Update client metadata
    client.sessionId = msg.sessionId;
    client.nickname = msg.nickname;
    client.color = getPlayerColor(msg.nickname);
    client.lastSeen = Date.now();
    this.setClientMetadata(ws, client);

    // Initialize or load game state
    let state = await this.getGameState();
    if (!state) {
      // Try to fetch existing state from Vercel KV via the Next.js API
      state = await this.fetchInitialStateFromKV(msg.teamCode);
      
      if (!state) {
        // Fallback: create new room state if KV fetch failed
        state = {
          teamCode: msg.teamCode,
          year: msg.year,
          division: msg.division,
          puzzleDate: msg.puzzleDate,
          answers: {},
          correctClues: [],
          startedAt: Date.now(),
          completedAt: null,
        };
      }
      
      await this.saveGameState(state);

      // Fetch puzzle clues for answer validation
      await this.loadPuzzleClues(msg.year, msg.division, msg.puzzleDate);
    }

    // Build player list from all connected WebSockets
    const players: Player[] = [];
    for (const socket of this.state.getWebSockets()) {
      const meta = this.getClientMetadata(socket);
      if (meta && meta.sessionId && meta.sessionId !== client.sessionId) {
        players.push({
          sessionId: meta.sessionId,
          nickname: meta.nickname,
          color: meta.color,
          cursor: meta.cursor,
          lastSeen: meta.lastSeen,
        });
      }
    }

    // Send init to joining player
    this.send(ws, {
      type: "init",
      state: {
        teamCode: state.teamCode,
        year: state.year,
        division: state.division,
        puzzleDate: state.puzzleDate,
        answers: state.answers,
        correctClues: state.correctClues,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
      },
      players,
      you: {
        sessionId: client.sessionId,
        nickname: client.nickname,
        color: client.color,
      },
    });

    // Broadcast join to others
    const allSockets = this.state.getWebSockets();
    this.broadcast(
      {
        type: "presence",
        action: "join",
        sessionId: client.sessionId,
        nickname: client.nickname,
        color: client.color,
        playerCount: allSockets.length,
      },
      ws
    );
  }

  private handleCursor(
    ws: WebSocket,
    client: ClientMetadata,
    msg: { type: "cursor"; row: number; col: number; direction: "across" | "down" }
  ) {
    if (!client.sessionId) return;

    client.cursor = { row: msg.row, col: msg.col, direction: msg.direction };
    client.lastSeen = Date.now();
    this.setClientMetadata(ws, client);

    // Broadcast cursor to others
    this.broadcast(
      {
        type: "cursor_update",
        sessionId: client.sessionId,
        nickname: client.nickname,
        color: client.color,
        row: msg.row,
        col: msg.col,
        direction: msg.direction,
      },
      ws
    );
  }

  private async handleLetter(
    ws: WebSocket,
    client: ClientMetadata,
    msg: { type: "letter"; row: number; col: number; letter: string }
  ) {
    if (!client.sessionId) return;

    const state = await this.getGameState();
    if (!state || state.completedAt) return;

    const cellKey = makeCellKey(msg.row, msg.col);
    const letter = msg.letter.toUpperCase();

    // Update state
    if (letter) {
      state.answers[cellKey] = letter;
    } else {
      delete state.answers[cellKey];
    }
    state.completedAt = null; // Reset in case somehow set

    // Check for newly completed clues
    const newCorrectClues = await this.checkCorrectClues(state);
    const newlyCorrect = newCorrectClues.filter(
      (id) => !state.correctClues.includes(id)
    );
    state.correctClues = newCorrectClues;

    // Check for puzzle completion
    const isComplete = await this.checkPuzzleComplete(state);
    if (isComplete && !state.completedAt) {
      state.completedAt = Date.now();
    }

    await this.saveGameState(state);

    // Broadcast letter update
    this.broadcast({
      type: "letter_update",
      row: msg.row,
      col: msg.col,
      letter,
      sessionId: client.sessionId,
    });

    // Broadcast any newly correct clues
    for (const clueId of newlyCorrect) {
      this.broadcast({ type: "correct_clue", clueId });
    }

    // Broadcast completion if puzzle is done
    if (isComplete && state.completedAt) {
      this.broadcast({
        type: "complete",
        completedAt: state.completedAt,
        completionTimeMs: state.completedAt - state.startedAt,
      });
    }
  }

  private async handleDelete(
    ws: WebSocket,
    client: ClientMetadata,
    msg: { type: "delete"; row: number; col: number }
  ) {
    if (!client.sessionId) return;

    const state = await this.getGameState();
    if (!state || state.completedAt) return;

    const cellKey = makeCellKey(msg.row, msg.col);
    delete state.answers[cellKey];

    // Recheck correct clues (some may no longer be correct)
    state.correctClues = await this.checkCorrectClues(state);

    await this.saveGameState(state);

    // Broadcast delete
    this.broadcast({
      type: "delete_update",
      row: msg.row,
      col: msg.col,
      sessionId: client.sessionId,
    });
  }

  private async getGameState(): Promise<StoredState | null> {
    if (this.gameState) return this.gameState;
    const stored = await this.state.storage.get<StoredState>("gameState");
    this.gameState = stored ?? null;
    return this.gameState;
  }

  private async saveGameState(state: StoredState): Promise<void> {
    this.gameState = state;
    await this.state.storage.put("gameState", state);
  }

  private async fetchInitialStateFromKV(teamCode: string): Promise<StoredState | null> {
    try {
      const url = `${this.env.PUZZLE_API_URL}/api/daily-crossword/team/${teamCode}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = (await response.json()) as { 
          success: boolean; 
          teamState?: {
            teamCode: string;
            year: string;
            division: string;
            puzzleDate: string;
            answers: Record<string, string>;
            correctClues: string[];
            startedAt: number;
            completedAt: number | null;
          };
        };
        if (data.success && data.teamState) {
          return {
            teamCode: data.teamState.teamCode,
            year: data.teamState.year,
            division: data.teamState.division,
            puzzleDate: data.teamState.puzzleDate,
            answers: data.teamState.answers || {},
            correctClues: data.teamState.correctClues || [],
            startedAt: data.teamState.startedAt,
            completedAt: data.teamState.completedAt,
          };
        }
      }
    } catch (err) {
      console.error("Failed to fetch initial state from KV:", err);
    }
    return null;
  }

  private async loadPuzzleClues(
    year: string,
    division: string,
    puzzleDate: string
  ): Promise<void> {
    try {
      const url = `${this.env.PUZZLE_API_URL}/api/daily-crossword/puzzle?year=${year}&division=${division}&date=${puzzleDate}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = (await response.json()) as { puzzle?: { clues?: PuzzleClue[] } };
        if (data.puzzle?.clues) {
          this.puzzleClues = new Map();
          for (const clue of data.puzzle.clues) {
            this.puzzleClues.set(clue.id, clue);
          }
          await this.state.storage.put("puzzleClues", Array.from(this.puzzleClues.entries()));
        }
      }
    } catch (err) {
      console.error("Failed to load puzzle clues:", err);
    }
  }

  private async getPuzzleClues(): Promise<Map<string, PuzzleClue>> {
    if (this.puzzleClues) return this.puzzleClues;
    const stored = await this.state.storage.get<[string, PuzzleClue][]>("puzzleClues");
    if (stored) {
      this.puzzleClues = new Map(stored);
    } else {
      this.puzzleClues = new Map();
    }
    return this.puzzleClues;
  }

  private async checkCorrectClues(state: StoredState): Promise<string[]> {
    const clues = await this.getPuzzleClues();
    const correctClues: string[] = [];

    for (const [id, clue] of clues) {
      if (this.isClueCorrect(clue, state.answers)) {
        correctClues.push(id);
      }
    }

    return correctClues;
  }

  private isClueCorrect(
    clue: PuzzleClue,
    answers: Record<string, string>
  ): boolean {
    const { startRow, startCol, direction, answer } = clue;

    for (let i = 0; i < answer.length; i++) {
      const row = direction === "down" ? startRow + i : startRow;
      const col = direction === "across" ? startCol + i : startCol;
      const key = makeCellKey(row, col);
      const userLetter = answers[key]?.toUpperCase();
      const expectedLetter = answer[i].toUpperCase();

      if (userLetter !== expectedLetter) {
        return false;
      }
    }

    return true;
  }

  private async checkPuzzleComplete(state: StoredState): Promise<boolean> {
    const clues = await this.getPuzzleClues();
    return clues.size > 0 && state.correctClues.length === clues.size;
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }

  private broadcast(msg: ServerMessage, exclude?: WebSocket): void {
    const msgStr = JSON.stringify(msg);
    for (const ws of this.state.getWebSockets()) {
      if (ws !== exclude) {
        try {
          ws.send(msgStr);
        } catch (err) {
          // WebSocket may be closed
        }
      }
    }
  }
}

interface PuzzleClue {
  id: string;
  number: number;
  direction: "across" | "down";
  answer: string;
  startRow: number;
  startCol: number;
}

interface Env {
  PUZZLE_API_URL: string;
  CROSSWORD_ROOM: DurableObjectNamespace;
}
