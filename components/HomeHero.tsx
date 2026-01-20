"use client";

import { BookOpen, Dog, Zap } from "lucide-react";
import { WavyUnderline } from "@/components/WavyUnderline";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import questionCounts from "@/lib/question-counts.json";
import ModeSelection from "@/components/ModeSelection";

const CURRENT_YEAR = "2025-2026";

export default function HomeHero() {
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
    <>
      <section className="max-w-2xl mx-auto space-y-4 mb-8 mt-4">
        <h1 className="text-5xl font-bold text-center font-rampart tracking-tight">
          <WavyUnderline style={0} thickness={6} color="text-lime-400">
            OBOB.DOG{" "}
          </WavyUnderline>
        </h1>
        <p className="text-xl text-center text-muted-foreground pt-1 font-heading font-medium">
          Read, practice, and have fun with Oregon Battle of the Books
        </p>

        <div className="max-w-lg mx-auto pt-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-700 text-center mb-3 font-heading">
              Pick your 2025-2026 division
            </p>
            <ToggleGroup
              type="single"
              value={division}
              onValueChange={(value) => {
                if (value) setDivision(value);
              }}
              className="justify-center"
            >
              <ToggleGroupItem
                value="3-5"
                aria-label="Elementary Division"
                className="data-[state=on]:bg-black data-[state=on]:text-white font-heading font-semibold"
              >
                Elementary
              </ToggleGroupItem>
              <ToggleGroupItem
                value="6-8"
                aria-label="Middle School Division"
                className="data-[state=on]:bg-black data-[state=on]:text-white font-heading font-semibold"
              >
                Middle
              </ToggleGroupItem>
              <ToggleGroupItem
                value="9-12"
                aria-label="High School Division"
                className="data-[state=on]:bg-black data-[state=on]:text-white font-heading font-semibold"
              >
                High
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="flex justify-center space-x-8 pt-4">
          <Link
            href={`/books/${year}/${division}`}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <BookOpen className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold font-heading">
                {division === "9-12" ? "12" : "16"}
              </p>
              <p className="text-sm text-muted-foreground font-medium">Books</p>
            </div>
          </Link>
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold font-heading">{getQuestionCount()}</p>
              <p className="text-sm text-muted-foreground font-medium">Questions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dog className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold font-heading">1</p>
              <p className="text-sm text-muted-foreground font-medium">Dog</p>
            </div>
          </div>
        </div>
      </section>

      <ModeSelection year={year} division={division} />
    </>
  );
}
