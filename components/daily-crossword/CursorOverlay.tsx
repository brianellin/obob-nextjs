"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import type { Player } from "@/hooks/useCrosswordWebSocket";

interface CursorOverlayProps {
  players: Map<string, Player>;
  gridRef: React.RefObject<HTMLDivElement | null>;
  gridRows: number;
  gridCols: number;
}

interface GridMetrics {
  cellSize: number;
  offsetX: number;
  offsetY: number;
}

export function CursorOverlay({
  players,
  gridRef,
  gridRows,
  gridCols,
}: CursorOverlayProps) {
  const [metrics, setMetrics] = useState<GridMetrics | null>(null);

  // Calculate cell size from the actual SVG
  const calculateMetrics = useCallback(() => {
    if (!gridRef.current) return;

    const svg = gridRef.current.querySelector('svg[viewBox]');
    if (!svg) return;

    const viewBox = svg.getAttribute('viewBox');
    if (!viewBox) return;

    // Parse viewBox: "0 0 200 200" -> get the width (200)
    const viewBoxParts = viewBox.split(' ').map(Number);
    const svgUnits = viewBoxParts[2]; // width in SVG units

    // Get actual rendered size
    const svgRect = svg.getBoundingClientRect();
    const containerRect = gridRef.current.getBoundingClientRect();

    // Scale factor: how many pixels per SVG unit
    const scale = svgRect.width / svgUnits;

    // The crossword library uses 10 SVG units per cell
    const cellSvgUnits = 10;
    const cellSize = cellSvgUnits * scale;

    // Calculate offset from container to SVG
    const offsetX = svgRect.left - containerRect.left;
    const offsetY = svgRect.top - containerRect.top;

    setMetrics({ cellSize, offsetX, offsetY });
  }, [gridRef]);

  // Calculate on mount and window resize
  useEffect(() => {
    calculateMetrics();

    const handleResize = () => calculateMetrics();
    window.addEventListener('resize', handleResize);
    
    // Recalculate after a short delay to handle dynamic rendering
    const timer = setTimeout(calculateMetrics, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [calculateMetrics]);

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

  if (cursors.length === 0 || !metrics) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
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
          cellSize={metrics.cellSize}
          offsetX={metrics.offsetX}
          offsetY={metrics.offsetY}
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
  offsetX: number;
  offsetY: number;
  gridRows: number;
  gridCols: number;
}

function CursorIndicator({
  nickname,
  color,
  row,
  col,
  cellSize,
  offsetX,
  offsetY,
  gridRows,
  gridCols,
}: CursorIndicatorProps) {
  // Validate bounds
  if (row < 0 || row >= gridRows || col < 0 || col >= gridCols) {
    return null;
  }

  // The crossword library uses a small padding (0.125 SVG units, scaled)
  // For visual alignment, we can use the cell position directly
  const left = offsetX + col * cellSize;
  const top = offsetY + row * cellSize;

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
        className="absolute inset-0 rounded-sm"
        style={{
          backgroundColor: color,
          opacity: 0.35,
          border: `2px solid ${color}`,
          boxShadow: `0 0 0 1px ${color}40`,
        }}
      />

      {/* Nickname label - position below cell when on top row */}
      <div
        className={`absolute left-0 px-1.5 py-0.5 text-xs font-medium text-white rounded shadow-sm whitespace-nowrap ${
          row === 0 ? "top-full mt-0.5" : "-top-5"
        }`}
        style={{
          backgroundColor: color,
          fontSize: "10px",
          lineHeight: "12px",
        }}
      >
        {nickname}
      </div>
    </div>
  );
}

export default CursorOverlay;
