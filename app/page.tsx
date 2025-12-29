"use client";
import { BookOpen, Dog, Zap, Swords, Flame } from "lucide-react";
import ModeSelection from "@/components/ModeSelection";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import questionCounts from "@/lib/question-counts.json";

const CURRENT_YEAR = "2025-2026";

export default function Home() {
  const year = CURRENT_YEAR;
  const [division, setDivision] = useState<string>("3-5");

  const getQuestionCount = () => {
    const count =
      questionCounts[year as keyof typeof questionCounts]?.[
        division as keyof (typeof questionCounts)[keyof typeof questionCounts]
      ] || 0;
    return count.toLocaleString();
  };

  return (
    <main className="obob-hero-bg min-h-screen -mx-2 -my-2 px-4 py-6 relative z-10">
      {/* Hero Section */}
      <section className="max-w-2xl mx-auto space-y-8 mb-12 mt-8">
        {/* Main Title - Brutal */}
        <div className="text-center animate-slice-in">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter obob-title mb-2">
            OBOB
            <span className="text-[hsl(var(--obob-electric))]">.</span>
            dog
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-[hsl(var(--obob-electric))]" />
            <Swords className="h-5 w-5 text-[hsl(var(--obob-electric))] animate-glitch-flicker" />
            <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-[hsl(var(--obob-electric))]" />
          </div>
        </div>

        {/* Tagline - harsh */}
        <p className="text-lg text-center text-[hsl(var(--obob-smoke))] animate-glitch-in animate-delay-1 max-w-lg mx-auto font-medium tracking-wide">
          Oregon Battle of the Books
          <span className="text-[hsl(var(--obob-electric))]"> // </span>
          <span className="text-[hsl(var(--obob-bone))]">READ. BATTLE. WIN.</span>
        </p>

        {/* Division Selector - brutal box */}
        <div className="max-w-sm mx-auto animate-glitch-in animate-delay-2">
          <div className="obob-division-toggle rounded-none p-4">
            <p className="text-xs font-bold text-[hsl(var(--obob-electric))] text-center mb-4 uppercase tracking-[0.2em]">
              Select Division
            </p>
            <ToggleGroup
              type="single"
              value={division}
              onValueChange={(value) => {
                if (value) setDivision(value);
              }}
              className="justify-center gap-1"
            >
              <ToggleGroupItem
                value="3-5"
                aria-label="Elementary Division"
                className="obob-division-btn px-4 py-2 rounded-none"
              >
                3-5
              </ToggleGroupItem>
              <ToggleGroupItem
                value="6-8"
                aria-label="Middle School Division"
                className="obob-division-btn px-4 py-2 rounded-none"
              >
                6-8
              </ToggleGroupItem>
              <ToggleGroupItem
                value="9-12"
                aria-label="High School Division"
                className="obob-division-btn px-4 py-2 rounded-none"
              >
                9-12
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Stats Row - harsh boxes */}
        <div className="flex justify-center gap-6 md:gap-10 pt-2 animate-glitch-in animate-delay-3">
          <Link
            href={`/books/${year}/${division}`}
            className="obob-stat flex flex-col items-center gap-1 group cursor-pointer px-4 py-3"
          >
            <BookOpen className="h-6 w-6 text-[hsl(var(--obob-plasma))] mb-1" />
            <p className="text-3xl font-black text-[hsl(var(--obob-bone))] tracking-tight">
              {division === "9-12" ? "12" : "16"}
            </p>
            <p className="text-[10px] text-[hsl(var(--obob-smoke))] uppercase tracking-[0.2em] font-bold">
              Books
            </p>
          </Link>

          <div className="obob-stat flex flex-col items-center gap-1 px-4 py-3">
            <Zap className="h-6 w-6 text-[hsl(var(--obob-volt))] mb-1" />
            <p className="text-3xl font-black text-[hsl(var(--obob-bone))] tracking-tight">
              {getQuestionCount()}
            </p>
            <p className="text-[10px] text-[hsl(var(--obob-smoke))] uppercase tracking-[0.2em] font-bold">
              Questions
            </p>
          </div>

          <div className="obob-stat flex flex-col items-center gap-1 px-4 py-3">
            <Flame className="h-6 w-6 text-[hsl(var(--obob-ember))] mb-1" />
            <p className="text-3xl font-black text-[hsl(var(--obob-bone))] tracking-tight">
              ∞
            </p>
            <p className="text-[10px] text-[hsl(var(--obob-smoke))] uppercase tracking-[0.2em] font-bold">
              Battles
            </p>
          </div>
        </div>
      </section>

      {/* Mode Selection */}
      <div className="animate-glitch-in animate-delay-4">
        <ModeSelection year={year} division={division} />
      </div>

      {/* Harsh Separator */}
      <div className="max-w-2xl mx-auto my-16 animate-glitch-in animate-delay-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-[2px] bg-[hsl(var(--obob-steel))]" />
          <Dog className="h-5 w-5 text-[hsl(var(--obob-electric))]" />
          <div className="flex-1 h-[2px] bg-[hsl(var(--obob-steel))]" />
        </div>
      </div>

      {/* Contribution Callout - brutal */}
      <section className="max-w-2xl mx-auto mb-8 animate-glitch-in animate-delay-6">
        <div className="obob-contribute rounded-none p-6">
          <div className="flex items-start gap-5 pl-4">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-[hsl(var(--obob-electric))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-[hsl(var(--obob-bone))] mb-2 uppercase tracking-wide">
                Join the Squad
              </h3>
              <p className="text-[hsl(var(--obob-smoke))] mb-4 leading-relaxed text-sm">
                Want to contribute questions? Help make OBOB.dog better for everyone.
              </p>
              <Link
                href="https://blog.obob.dog/3lyiutdo3zk2l"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[hsl(var(--obob-electric))] font-bold uppercase tracking-wide text-sm hover:text-[hsl(var(--obob-volt))] transition-colors group"
              >
                Read the Guide
                <span className="group-hover:translate-x-1 transition-transform font-mono">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
