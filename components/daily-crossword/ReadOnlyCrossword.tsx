"use client";

import type { SerializedCrosswordPuzzle } from "@/lib/daily-crossword/types";

interface ReadOnlyCrosswordProps {
  puzzle: SerializedCrosswordPuzzle;
}

export default function ReadOnlyCrossword({ puzzle }: ReadOnlyCrosswordProps) {
  const { grid, clues, rows, cols, cellNumbers } = puzzle;

  const acrossClues = clues
    .filter((c) => c.direction === "across")
    .sort((a, b) => a.number - b.number);
  const downClues = clues
    .filter((c) => c.direction === "down")
    .sort((a, b) => a.number - b.number);

  // Calculate cell size based on grid dimensions
  const maxCellSize = 32;
  const minCellSize = 20;
  const cellSize = Math.max(minCellSize, Math.min(maxCellSize, Math.floor(360 / cols)));

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="flex justify-center">
        <div
          className="inline-grid border border-black"
          style={{
            gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r},${c}`;
              const number = cellNumbers[key];
              const isBlack = cell === null;

              return (
                <div
                  key={key}
                  className={`relative border border-gray-300 flex items-center justify-center ${
                    isBlack ? "bg-black" : "bg-white"
                  }`}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {!isBlack && number && (
                    <span
                      className="absolute text-gray-500 font-medium leading-none"
                      style={{
                        top: 1,
                        left: 2,
                        fontSize: cellSize < 26 ? 7 : 9,
                      }}
                    >
                      {number}
                    </span>
                  )}
                  {!isBlack && cell && (
                    <span
                      className="font-bold text-black uppercase leading-none"
                      style={{ fontSize: cellSize < 26 ? 11 : 14 }}
                    >
                      {cell}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clues */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
        <div>
          <h3 className="font-bold text-black font-serif mb-2 text-base">Across</h3>
          <ol className="space-y-2">
            {acrossClues.map((clue) => (
              <li key={clue.id} className="flex gap-2">
                <span className="font-bold text-gray-500 shrink-0 w-6 text-right">
                  {clue.number}.
                </span>
                <div>
                  <span className="text-gray-700">{clue.text}</span>
                  <span className="ml-1 font-semibold text-black">{clue.answer}</span>
                  <span className="text-gray-400 text-xs ml-1">
                    ({clue.bookTitle}{clue.page ? `, p.${clue.page}` : ""})
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="font-bold text-black font-serif mb-2 text-base">Down</h3>
          <ol className="space-y-2">
            {downClues.map((clue) => (
              <li key={clue.id} className="flex gap-2">
                <span className="font-bold text-gray-500 shrink-0 w-6 text-right">
                  {clue.number}.
                </span>
                <div>
                  <span className="text-gray-700">{clue.text}</span>
                  <span className="ml-1 font-semibold text-black">{clue.answer}</span>
                  <span className="text-gray-400 text-xs ml-1">
                    ({clue.bookTitle}{clue.page ? `, p.${clue.page}` : ""})
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
