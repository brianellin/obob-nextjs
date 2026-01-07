"use client";

import { Clock } from "lucide-react";

interface CompletionBannerProps {
  completionTime: string;
  isMultiplayer?: boolean;
}

export function CompletionBanner({ completionTime, isMultiplayer = true }: CompletionBannerProps) {
  return (
    <div className="relative bg-stone-50 border-b border-stone-300 py-6 px-4">
      {/* Subtle newspaper texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="relative flex flex-col items-center gap-3 max-w-md mx-auto text-center">
        {/* Decorative rule */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-stone-400" />
          <div className="w-1.5 h-1.5 rotate-45 bg-stone-400" />
          <div className="flex-1 h-px bg-stone-400" />
        </div>

        {/* Main headline */}
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight animate-fade-in-up">
          Puzzle Complete
        </h2>

        {/* Subhead in italic */}
        <p className="font-serif italic text-stone-600 text-lg animate-fade-in-up animation-delay-100">
          {isMultiplayer ? "A collaborative triumph" : "Well done, solver"}
        </p>

        {/* Time display */}
        <div className="flex items-center gap-2 text-stone-700 animate-fade-in-up animation-delay-200">
          <Clock className="w-4 h-4" strokeWidth={1.5} />
          <span className="font-serif text-sm tracking-wide uppercase">
            Solved in {completionTime}
          </span>
        </div>

        {/* Decorative rule */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-stone-400" />
          <div className="w-1.5 h-1.5 rotate-45 bg-stone-400" />
          <div className="flex-1 h-px bg-stone-400" />
        </div>

        {/* Call to action */}
        <p className="text-stone-500 text-sm font-sans mt-1 animate-fade-in-up animation-delay-200">
          Return tomorrow for the next puzzle
        </p>
      </div>
    </div>
  );
}
