"use client";
import { BookOpen, Dog, Zap, TreePine, Sparkles } from "lucide-react";
import ModeSelection from "@/components/ModeSelection";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import questionCounts from "@/lib/question-counts.json";

const CURRENT_YEAR = "2025-2026";

export default function Home() {
  const year = CURRENT_YEAR;
  const [division, setDivision] = useState<string>("3-5");

  // Get question count for current year/division
  const getQuestionCount = () => {
    const count =
      questionCounts[year as keyof typeof questionCounts]?.[
        division as keyof (typeof questionCounts)[keyof typeof questionCounts]
      ] || 0;
    return count.toLocaleString();
  };

  return (
    <main className="obob-hero-bg min-h-screen -mx-2 -my-2 px-2 py-2">
      {/* Decorative floating elements */}
      <div className="absolute top-20 left-10 opacity-20 animate-float hidden md:block">
        <TreePine className="h-16 w-16 text-[hsl(var(--obob-forest))]" />
      </div>
      <div className="absolute top-40 right-12 opacity-15 animate-float-delayed hidden md:block">
        <Sparkles className="h-12 w-12 text-[hsl(var(--obob-amber))]" />
      </div>

      {/* Hero Section */}
      <section className="max-w-2xl mx-auto space-y-6 mb-10 mt-6 relative">
        {/* Main Title */}
        <div className="text-center animate-fade-up">
          <h1 className="font-[family-name:var(--font-playfair)] text-5xl md:text-6xl font-black tracking-tight obob-title mb-3">
            OBOB.dog
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[hsl(var(--obob-amber))]" />
            <Dog className="h-5 w-5 text-[hsl(var(--obob-amber))]" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[hsl(var(--obob-amber))]" />
          </div>
        </div>

        {/* Tagline */}
        <p className="text-xl text-center text-[hsl(var(--obob-bark))] opacity-80 animate-fade-up animate-delay-1 max-w-md mx-auto leading-relaxed">
          Read, practice, and have fun with Oregon Battle of the Books
        </p>

        {/* Division Selector */}
        <div className="max-w-md mx-auto pt-2 animate-fade-up animate-delay-2">
          <div className="obob-division-toggle rounded-xl p-5">
            <p className="text-sm font-semibold text-[hsl(var(--obob-forest))] text-center mb-4 uppercase tracking-wide">
              2025-2026 Division
            </p>
            <ToggleGroup
              type="single"
              value={division}
              onValueChange={(value) => {
                if (value) setDivision(value);
              }}
              className="justify-center gap-2"
            >
              <ToggleGroupItem
                value="3-5"
                aria-label="Elementary Division"
                className="obob-division-btn px-5 py-2 rounded-lg font-medium"
              >
                Elementary
              </ToggleGroupItem>
              <ToggleGroupItem
                value="6-8"
                aria-label="Middle School Division"
                className="obob-division-btn px-5 py-2 rounded-lg font-medium"
              >
                Middle
              </ToggleGroupItem>
              <ToggleGroupItem
                value="9-12"
                aria-label="High School Division"
                className="obob-division-btn px-5 py-2 rounded-lg font-medium"
              >
                High
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-8 md:gap-12 pt-4 animate-fade-up animate-delay-3">
          <Link
            href={`/books/${year}/${division}`}
            className="obob-stat flex items-center gap-3 group cursor-pointer"
          >
            <div className="p-2.5 rounded-xl bg-[hsl(var(--obob-forest)/0.1)] group-hover:bg-[hsl(var(--obob-forest)/0.15)] transition-colors">
              <BookOpen className="h-5 w-5 text-[hsl(var(--obob-forest))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--obob-bark))] font-[family-name:var(--font-playfair)]">
                {division === "9-12" ? "12" : "16"}
              </p>
              <p className="text-xs text-[hsl(var(--obob-bark))] opacity-60 uppercase tracking-wide">
                Books
              </p>
            </div>
          </Link>

          <div className="obob-stat flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[hsl(var(--obob-amber)/0.15)]">
              <Zap className="h-5 w-5 text-[hsl(var(--obob-amber))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--obob-bark))] font-[family-name:var(--font-playfair)]">
                {getQuestionCount()}
              </p>
              <p className="text-xs text-[hsl(var(--obob-bark))] opacity-60 uppercase tracking-wide">
                Questions
              </p>
            </div>
          </div>

          <div className="obob-stat flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[hsl(var(--obob-forest)/0.1)]">
              <Dog className="h-5 w-5 text-[hsl(var(--obob-forest))]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[hsl(var(--obob-bark))] font-[family-name:var(--font-playfair)]">
                1
              </p>
              <p className="text-xs text-[hsl(var(--obob-bark))] opacity-60 uppercase tracking-wide">
                Good Dog
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mode Selection */}
      <div className="animate-fade-up animate-delay-4">
        <ModeSelection year={year} division={division} />
      </div>

      {/* Decorative Separator */}
      <div className="max-w-2xl mx-auto my-12 animate-fade-up animate-delay-5">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--obob-cream-dark))] to-transparent" />
          <TreePine className="h-4 w-4 text-[hsl(var(--obob-forest))] opacity-30" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(var(--obob-cream-dark))] to-transparent" />
        </div>
      </div>

      {/* Contribution Callout */}
      <section className="max-w-2xl mx-auto mb-8 animate-fade-up animate-delay-6">
        <div className="obob-contribute rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-xl bg-[hsl(var(--obob-amber)/0.1)]">
              <BookOpen className="h-6 w-6 text-[hsl(var(--obob-amber))]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[hsl(var(--obob-bark))] mb-2 font-[family-name:var(--font-playfair)]">
                Help improve OBOB.dog!
              </h3>
              <p className="text-[hsl(var(--obob-bark))] opacity-70 mb-4 leading-relaxed">
                Interested in contributing new questions to OBOB.dog? You can
                help make it better for everyone.
              </p>
              <Link
                href="https://blog.obob.dog/3lyiutdo3zk2l"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[hsl(var(--obob-forest))] font-semibold hover:text-[hsl(var(--obob-forest-light))] transition-colors group"
              >
                Read our contribution guide
                <span className="group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
