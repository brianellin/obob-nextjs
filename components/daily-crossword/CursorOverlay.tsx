"use client";

import { useMemo } from "react";
import type { Player } from "@/hooks/useCrosswordWebSocket";

interface CursorOverlayProps {
  players: Map<string, Player>;
  gridRef: React.RefObject<HTMLDivElement | null>;
  cellSize: number;
  gridRows: number;
  gridCols: number;
}

export function CursorOverlay({
  players,
  gridRef,
  cellSize,
  gridRows,
  gridCols,
}: CursorOverlayProps) {
  const cursors = useMemo(() => {
    const result: Array<{
      sessionId: string;
      nickname: string;
      color: string;
      row: number;
      col: number;
      direction: "across" | "down";
    }> = [];

    for (const [, player] of players) {
      if (player.cursor) {
        result.push({
          sessionId: player.sessionId,
          nickname: player.nickname,
          color: player.color,
          row: player.cursor.row,
          col: player.cursor.col,
          direction: player.cursor.direction,
        });
      }
    }

    return result;
  }, [players]);

  if (cursors.length === 0) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {cursors.map((cursor) => (
        <CursorIndicator
          key={cursor.sessionId}
          nickname={cursor.nickname}
          color={cursor.color}
          row={cursor.row}
          col={cursor.col}
          direction={cursor.direction}
          cellSize={cellSize}
          gridRows={gridRows}
          gridCols={gridCols}
        />
      ))}
    </div>
  );
}

interface CursorIndicatorProps {
  nickname: string;
  color: string;
  row: number;
  col: number;
  direction: "across" | "down";
  cellSize: number;
  gridRows: number;
  gridCols: number;
}

function CursorIndicator({
  nickname,
  color,
  row,
  col,
  cellSize,
  gridRows,
  gridCols,
}: CursorIndicatorProps) {
  // Validate bounds
  if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) {
    return null;
  }

  const left = col * cellSize;
  const top = row * cellSize;

  return (
    <div
      className="absolute transition-all duration-150 ease-out"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${cellSize}px`,
        height: `${cellSize}px`,
      }}
    >
      {/* Cursor highlight */}
      <div
        className="absolute inset-0 rounded-sm animate-pulse"
        style={{
          backgroundColor: color,
          opacity: 0.3,
          border: `2px solid ${color}`,
        }}
      />

      {/* Nickname label */}
      <div
        className="absolute -top-5 left-0 px-1 text-xs font-medium text-white rounded whitespace-nowrap"
        style={{
          backgroundColor: color,
          fontSize: "10px",
          lineHeight: "14px",
        }}
      >
        {nickname}
      </div>
    </div>
  );
}

export default CursorOverlay;
