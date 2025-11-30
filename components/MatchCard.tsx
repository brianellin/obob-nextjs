"use client";

import { useState, useEffect, useRef } from "react";
import { Book, Dog } from "lucide-react";

// Color palette for matched pairs - 16 distinct vibrant colors to support all divisions
const MATCH_COLORS = [
  { bg: "bg-green-200", border: "border-green-600", text: "text-green-900" },
  { bg: "bg-blue-200", border: "border-blue-600", text: "text-blue-900" },
  { bg: "bg-pink-200", border: "border-pink-600", text: "text-pink-900" },
  { bg: "bg-yellow-200", border: "border-yellow-600", text: "text-yellow-900" },
  { bg: "bg-purple-200", border: "border-purple-600", text: "text-purple-900" },
  { bg: "bg-red-200", border: "border-red-600", text: "text-red-900" },
  { bg: "bg-cyan-200", border: "border-cyan-600", text: "text-cyan-900" },
  { bg: "bg-orange-200", border: "border-orange-600", text: "text-orange-900" },
  { bg: "bg-indigo-200", border: "border-indigo-600", text: "text-indigo-900" },
  { bg: "bg-lime-200", border: "border-lime-600", text: "text-lime-900" },
  { bg: "bg-rose-200", border: "border-rose-600", text: "text-rose-900" },
  { bg: "bg-teal-200", border: "border-teal-600", text: "text-teal-900" },
  { bg: "bg-amber-200", border: "border-amber-600", text: "text-amber-900" },
  { bg: "bg-violet-200", border: "border-violet-600", text: "text-violet-900" },
  { bg: "bg-emerald-200", border: "border-emerald-600", text: "text-emerald-900" },
  { bg: "bg-fuchsia-200", border: "border-fuchsia-600", text: "text-fuchsia-900" },
];

export interface MatchCardData {
  id: string;
  bookKey: string;
  type: "title" | "author";
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  colorIndex?: number;
}

interface MatchCardProps {
  card: MatchCardData;
  onClick: () => void;
  disabled: boolean;
}

export default function MatchCard({ card, onClick, disabled }: MatchCardProps) {
  const [isJiggling, setIsJiggling] = useState(false);
  const wasMatched = useRef(card.isMatched);

  // Detect when card becomes matched and trigger jiggle
  useEffect(() => {
    if (card.isMatched && !wasMatched.current) {
      setIsJiggling(true);
      const timer = setTimeout(() => setIsJiggling(false), 500);
      return () => clearTimeout(timer);
    }
    wasMatched.current = card.isMatched;
  }, [card.isMatched]);

  const handleClick = () => {
    if (!disabled && !card.isFlipped && !card.isMatched) {
      onClick();
    }
  };

  return (
    <div
      className="aspect-square cursor-pointer perspective-1000"
      onClick={handleClick}
      style={{ perspective: "1000px" }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
          card.isFlipped || card.isMatched ? "rotate-y-180" : ""
        } ${isJiggling ? "animate-card-jiggle" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          transform: card.isFlipped || card.isMatched ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Back of card - white with black book for titles, black with white dog for authors */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-lg shadow-md ${
            card.type === "title"
              ? `bg-gradient-to-br from-white to-gray-200 border border-gray-300 ${!card.isFlipped && !card.isMatched ? "hover:from-gray-50 hover:to-gray-300" : ""}`
              : `bg-gradient-to-br from-gray-700 to-black ${!card.isFlipped && !card.isMatched ? "hover:from-gray-600 hover:to-gray-900" : ""}`
          }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {card.type === "title" ? (
            <Book className="w-1/2 h-1/2 text-black/70" strokeWidth={1.5} />
          ) : (
            <Dog className="w-1/2 h-1/2 text-white/80" strokeWidth={1.5} />
          )}
        </div>

        {/* Front of card (content) */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-lg p-1.5 shadow-md ${
            card.isMatched && card.colorIndex !== undefined
              ? `${MATCH_COLORS[card.colorIndex % MATCH_COLORS.length].bg} border-2 ${MATCH_COLORS[card.colorIndex % MATCH_COLORS.length].border}`
              : "bg-white border border-gray-200"
          }`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p
            className={`font-semibold leading-tight text-center ${
              card.isMatched && card.colorIndex !== undefined
                ? MATCH_COLORS[card.colorIndex % MATCH_COLORS.length].text
                : "text-gray-800"
            } ${
              card.content.length > 40
                ? "text-[9px] sm:text-xs"
                : card.content.length > 25
                ? "text-[10px] sm:text-xs"
                : "text-xs sm:text-sm"
            }`}
          >
            {card.content}
          </p>
        </div>
      </div>
    </div>
  );
}
