# Real-Time Collaborative Crossword with Cloudflare Durable Objects

## Current State

The crossword collaboration currently uses:
- **Vercel KV (Redis)** for state storage
- **HTTP Long-polling** (25-second holds) for sync
- **No cursor/presence tracking** - just member names

### Problems with Current Approach

1. **Latency**: Long-polling means updates can take 0.5-25 seconds to propagate
2. **No live cursors**: Kids can't see where teammates are typing in real-time
3. **Expensive polling**: Each client polls KV every 500ms while waiting, burning reads
4. **Race conditions**: Two kids typing in same cell can overwrite each other
5. **No "typing indicator"**: Can't see when someone is actively working on a clue

---

## Proposed Architecture

### Cloudflare Durable Objects + WebSockets

```
┌─────────────────┐     WebSocket      ┌──────────────────────────┐
│  Kid's Browser  │◄──────────────────►│  Cloudflare Worker       │
│  (Next.js app)  │                    │                          │
└─────────────────┘                    │  ┌────────────────────┐  │
                                       │  │  Durable Object    │  │
┌─────────────────┐     WebSocket      │  │  (per team room)   │  │
│  Kid's Browser  │◄──────────────────►│  │                    │  │
│  (teammate)     │                    │  │  - Game state      │  │
└─────────────────┘                    │  │  - Active cursors  │  │
                                       │  │  - WebSocket conns │  │
                                       │  └────────────────────┘  │
                                       └──────────────────────────┘
                                                    │
                                                    │ Fetch puzzle data
                                                    ▼
                                       ┌──────────────────────────┐
                                       │  Next.js API (Vercel)    │
                                       │  - Generate daily puzzle │
                                       │  - Validate answers      │
                                       └──────────────────────────┘
```

### Why Durable Objects?

1. **Single point of coordination**: One Durable Object instance per team room handles all state
2. **Built-in WebSocket support**: Native WebSocket hibernation (no connection limits)
3. **In-memory + persistent**: Fast reads/writes with automatic persistence
4. **Geographic routing**: Requests route to the nearest Cloudflare edge
5. **No cold start for active games**: DO stays warm while players are connected

---

## Enhanced Real-Time Features

### 1. Live Cursors
Show where each teammate's cursor is in the crossword grid:
- Cell position (row, col)
- Current selection direction (across/down)
- Player color (consistent per session)

### 2. Typing Indicators
When a kid is typing in a cell:
- Show their avatar/color in that cell
- Brief "ghost" of what they're typing
- Smooth animation when letters appear

### 3. Instant Updates
- Letters appear on teammates' screens in <50ms
- Correct answers highlight immediately for everyone
- Completion celebration triggers simultaneously

### 4. Presence
- See who's currently in the room (with status: active/idle)
- "X joined the game" / "X left" notifications
- Last activity timestamp per player

---

## Implementation Plan

### Phase 1: Cloudflare Worker Setup

**Files to create:**
```
cloudflare/
├── wrangler.toml           # Worker configuration
├── src/
│   ├── index.ts            # Worker entry point
│   ├── crossword-room.ts   # Durable Object class
│   ├── types.ts            # Shared types
│   └── protocol.ts         # WebSocket message types
└── package.json
```

**Durable Object: CrosswordRoom**
- One instance per team code (e.g., `BARK42`)
- Stores: answers, correct clues, cursors, presence
- Broadcasts changes to all connected clients
- Hibernates when no connections (cost-effective)

### Phase 2: WebSocket Protocol

**Client → Server Messages:**
```typescript
// Join the room
{ type: "join", sessionId: string, nickname: string }

// Update cursor position
{ type: "cursor", row: number, col: number, direction: "across" | "down" }

// Submit a letter
{ type: "letter", row: number, col: number, letter: string }

// Delete a letter
{ type: "delete", row: number, col: number }

// Heartbeat (for presence)
{ type: "ping" }
```

**Server → Client Messages:**
```typescript
// Initial state on join
{ type: "init", state: GameState, players: Player[] }

// Another player's cursor moved
{ type: "cursor", sessionId: string, row: number, col: number, direction: string }

// A letter was placed (by anyone)
{ type: "letter", row: number, col: number, letter: string, sessionId: string }

// A letter was deleted
{ type: "delete", row: number, col: number, sessionId: string }

// A clue was completed correctly
{ type: "correct", clueId: string }

// Puzzle completed!
{ type: "complete", completedAt: number, completionTimeMs: number }

// Player joined/left
{ type: "presence", sessionId: string, action: "join" | "leave", nickname: string }

// Heartbeat response
{ type: "pong" }
```

### Phase 3: Client Updates

**Changes to CollaborativeCrossword.tsx:**
1. Replace long-polling with WebSocket connection
2. Add cursor overlay component showing teammate positions
3. Add typing indicators
4. Optimistic updates with server reconciliation

**New components:**
- `CursorOverlay.tsx` - Renders colored cursors for each teammate
- `PresenceIndicator.tsx` - Shows who's online with status

### Phase 4: Migration Path

Keep both systems running during transition:
1. WebSocket connects to Cloudflare DO for real-time
2. Vercel KV used for puzzle generation and validation
3. DO fetches puzzle data from Next.js API on room creation

---

## Cloudflare Setup Guide

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Authenticate
```bash
wrangler login
```

### 3. Create the Worker project
```bash
cd cloudflare
npm init -y
npm install -D wrangler typescript @cloudflare/workers-types
```

### 4. Configure wrangler.toml
```toml
name = "obob-crossword-realtime"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[durable_objects]
bindings = [
  { name = "CROSSWORD_ROOM", class_name = "CrosswordRoom" }
]

[[migrations]]
tag = "v1"
new_classes = ["CrosswordRoom"]
```

### 5. Deploy
```bash
wrangler deploy
```

### 6. Environment Variables
Set in Cloudflare dashboard or wrangler.toml:
- `PUZZLE_API_URL` - Your Vercel deployment URL for puzzle data

---

## Cost Considerations

**Durable Objects pricing:**
- $0.15 per million requests
- $0.10 per GB-month storage
- $12.50 per million WebSocket messages

**For OBOB scale (~100 teams/day, ~30 min sessions):**
- Estimated: <$5/month

**Compared to current approach:**
- Vercel KV reads: ~4,320,000/month at heavy polling → $43+
- Durable Objects with WebSockets: Much cheaper for real-time

---

## Timeline

| Phase | Description | Effort |
|-------|-------------|--------|
| 1 | Cloudflare Worker + DO skeleton | 2 hours |
| 2 | WebSocket protocol implementation | 3 hours |
| 3 | Client WebSocket integration | 3 hours |
| 4 | Cursor/presence UI | 2 hours |
| 5 | Testing & polish | 2 hours |

**Total: ~12 hours**

---

## Questions to Decide

1. **Fallback strategy**: If WebSocket fails, fall back to polling or show error?
2. **Cursor colors**: Random assignment or deterministic from session ID?
3. **Presence timeout**: How long until a player shows as "idle"? (suggest: 30s)
4. **Room expiry**: Auto-close room after puzzle completion? (suggest: 1 hour)

---

## Next Steps

1. Create Cloudflare project structure
2. Implement CrosswordRoom Durable Object
3. Set up WebSocket handling
4. Update React client
5. Test with multiple browsers
6. Deploy and test at scale
