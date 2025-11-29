"use client";

import { useState, useEffect, useRef } from "react";
import { PawPrint } from "lucide-react";

// Color palette for matched pairs - 16 distinct colors to support all divisions
const MATCH_COLORS = [
  { bg: "bg-green-100", border: "border-green-500", text: "text-green-800" },
  { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue-800" },
  { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink-800" },
  { bg: "bg-yellow-100", border: "border-yellow-500", text: "text-yellow-800" },
  { bg: "bg-cyan-100", border: "border-cyan-500", text: "text-cyan-800" },
  { bg: "bg-red-100", border: "border-red-500", text: "text-red-800" },
  { bg: "bg-indigo-100", border: "border-indigo-500", text: "text-indigo-800" },
  { bg: "bg-teal-100", border: "border-teal-500", text: "text-teal-800" },
  { bg: "bg-amber-100", border: "border-amber-500", text: "text-amber-800" },
  { bg: "bg-violet-100", border: "border-violet-500", text: "text-violet-800" },
  { bg: "bg-lime-100", border: "border-lime-500", text: "text-lime-800" },
  { bg: "bg-rose-100", border: "border-rose-500", text: "text-rose-800" },
  { bg: "bg-sky-100", border: "border-sky-500", text: "text-sky-800" },
  { bg: "bg-fuchsia-100", border: "border-fuchsia-500", text: "text-fuchsia-800" },
  { bg: "bg-emerald-100", border: "border-emerald-500", text: "text-emerald-800" },
  { bg: "bg-orange-100", border: "border-orange-500", text: "text-orange-800" },
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
        {/* Back of card (paw print) - purple for titles, orange for authors */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-lg shadow-md ${
            card.type === "title"
              ? `bg-gradient-to-br from-purple-500 to-purple-700 ${!card.isFlipped && !card.isMatched ? "hover:from-purple-400 hover:to-purple-600" : ""}`
              : `bg-gradient-to-br from-orange-400 to-orange-600 ${!card.isFlipped && !card.isMatched ? "hover:from-orange-300 hover:to-orange-500" : ""}`
          }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <PawPrint className="w-1/2 h-1/2 text-white/80" />
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
