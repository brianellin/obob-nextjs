"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CrosswordClue, Direction } from "@/lib/crossword/types";

interface CrosswordClueListProps {
  clues: CrosswordClue[];
  selectedClueId: string | null;
  completedClueIds: Set<string>;
  correctClueIds: Set<string>;
  onClueClick: (clue: CrosswordClue) => void;
  direction: Direction;
  className?: string;
}

export default function CrosswordClueList({
  clues,
  selectedClueId,
  completedClueIds,
  correctClueIds,
  onClueClick,
  direction,
  className,
}: CrosswordClueListProps) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Filter clues by direction
  const filteredClues = clues.filter((c) => c.direction === direction);

  // Scroll selected clue into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedClueId]);

  // Capitalize first letter of clue text
  const formatClueText = (text: string): string => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const clueContent = (
    <div className="space-y-1 lg:space-y-2 pr-4">
      {filteredClues.map((clue) => {
        const isSelected = selectedClueId === clue.id;
        const isCompleted = completedClueIds.has(clue.id);
        const isCorrect = correctClueIds.has(clue.id);

        return (
          <button
            key={clue.id}
            ref={isSelected ? selectedRef : null}
            onClick={() => onClueClick(clue)}
            className={cn(
              "w-full text-left p-2 lg:p-3 rounded-md transition-colors",
              "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500",
              isSelected && "bg-cyan-100 hover:bg-cyan-100",
              isCorrect && "bg-emerald-50",
              isCompleted && !isCorrect && "opacity-75"
            )}
          >
            <div className="flex gap-2 lg:gap-3">
              <span
                className={cn(
                  "font-bold text-sm lg:text-base min-w-[1.5rem]",
                  isCorrect && "text-emerald-600"
                )}
              >
                {clue.number}.
              </span>
              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm lg:text-base leading-snug",
                    isCompleted && "line-through text-gray-400",
                    isCorrect && "text-emerald-700 no-underline line-through"
                  )}
                >
                  {formatClueText(clue.text)}
                </p>
                <p className="text-xs lg:text-sm text-gray-500 mt-0.5 italic">
                  {clue.bookTitle}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className={cn("flex flex-col", className)}>
      <h3 className="font-bold text-lg lg:text-xl mb-2 lg:mb-3 capitalize px-1">{direction}</h3>
      {/* Mobile: use ScrollArea */}
      <ScrollArea className="flex-1 min-h-0 lg:hidden">
        {clueContent}
      </ScrollArea>
      {/* Desktop: no scroll, show all content */}
      <div className="hidden lg:block">
        {clueContent}
      </div>
    </div>
  );
}
