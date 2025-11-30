"use client";

import { useState, useEffect, useRef } from "react";
import RosieIcon from "./RosieIcon";
import BookHeartIcon from "./BookHeartIcon";

// Color palette for matched pairs - 16 maximally distinct colors to support all divisions
export const MATCH_COLORS = [
  { bg: "bg-red-200", border: "border-red-600", text: "text-red-900" },
  { bg: "bg-blue-200", border: "border-blue-600", text: "text-blue-900" },
  { bg: "bg-green-200", border: "border-green-600", text: "text-green-900" },
  { bg: "bg-yellow-200", border: "border-yellow-600", text: "text-yellow-900" },
  { bg: "bg-purple-200", border: "border-purple-600", text: "text-purple-900" },
  { bg: "bg-orange-200", border: "border-orange-600", text: "text-orange-900" },
  { bg: "bg-cyan-200", border: "border-cyan-600", text: "text-cyan-900" },
  { bg: "bg-pink-200", border: "border-pink-600", text: "text-pink-900" },
  { bg: "bg-lime-300", border: "border-lime-600", text: "text-lime-900" },
  { bg: "bg-indigo-200", border: "border-indigo-600", text: "text-indigo-900" },
  { bg: "bg-amber-300", border: "border-amber-600", text: "text-amber-900" },
  { bg: "bg-teal-300", border: "border-teal-600", text: "text-teal-900" },
  { bg: "bg-fuchsia-300", border: "border-fuchsia-600", text: "text-fuchsia-900" },
  { bg: "bg-emerald-300", border: "border-emerald-600", text: "text-emerald-900" },
  { bg: "bg-rose-300", border: "border-rose-600", text: "text-rose-900" },
  { bg: "bg-sky-200", border: "border-sky-600", text: "text-sky-900" },
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
  colorOrder?: number[];
}

export default function MatchCard({ card, onClick, disabled, colorOrder }: MatchCardProps) {
  const [isJiggling, setIsJiggling] = useState(false);
  const wasMatched = useRef(card.isMatched);

  // Get the actual color index using the shuffled order if provided
  const getColor = (index: number) => {
    const actualIndex = colorOrder ? colorOrder[index % colorOrder.length] : index;
    return MATCH_COLORS[actualIndex % MATCH_COLORS.length];
  };

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
        {/* Back of card - dark with BookHeart for titles, light with Rosie for authors */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-lg shadow-md ${
            card.type === "title"
              ? `bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-300 ${!card.isFlipped && !card.isMatched ? "hover:from-gray-150 hover:to-gray-350" : ""}`
              : `bg-gradient-to-br from-white to-gray-100 border border-gray-200 ${!card.isFlipped && !card.isMatched ? "hover:from-gray-50 hover:to-gray-200" : ""}`
          }`}
          style={{ backfaceVisibility: "hidden" }}
        >
          {card.type === "title" ? (
            <BookHeartIcon className="w-1/2 h-1/2" />
          ) : (
            <RosieIcon className="w-1/2 h-1/2" />
          )}
        </div>

        {/* Front of card (content) */}
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-lg p-1.5 shadow-md ${
            card.isMatched && card.colorIndex !== undefined
              ? `${getColor(card.colorIndex).bg} border-2 ${getColor(card.colorIndex).border}`
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
                ? getColor(card.colorIndex).text
                : "text-gray-800"
            } ${
              card.content.length > 40
                ? "text-[9px] sm:text-xs"
                : card.content.length > 25
                ? "text-[10px] sm:text-xs"
                : "text-xs sm:text-sm"
            } ${card.type === "author" ? "italic" : ""}`}
          >
            {card.content}
          </p>
        </div>
      </div>
    </div>
  );
}
