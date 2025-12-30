"use client";
import { BookOpen, Dog, Zap } from "lucide-react";
import ModeSelection from "@/components/ModeSelection";
import { WavyUnderline } from "@/components/WavyUnderline";
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
    <main className="bg-white p-2">
      <section className="max-w-2xl mx-auto space-y-4 mb-8 mt-4">
        <h1 className="text-5xl font-bold text-center font-luckiest-guy">
          <WavyUnderline style={0} thickness={6} color="text-lime-400">
            OBOB.dog{" "}
          </WavyUnderline>
        </h1>
        <p className="text-xl text-center text-muted-foreground pt-1">
          Read, practice, and have fun with Oregon Battle of the Books
        </p>

        <div className="max-w-lg mx-auto pt-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700 text-center mb-3">
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
                className="data-[state=on]:bg-black data-[state=on]:text-white"
              >
                Elementary
              </ToggleGroupItem>
              <ToggleGroupItem
                value="6-8"
                aria-label="Middle School Division"
                className="data-[state=on]:bg-black data-[state=on]:text-white"
              >
                Middle
              </ToggleGroupItem>
              <ToggleGroupItem
                value="9-12"
                aria-label="High School Division"
                className="data-[state=on]:bg-black data-[state=on]:text-white"
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
              <p className="text-2xl font-bold">
                {division === "9-12" ? "12" : "16"}
              </p>
              <p className="text-sm text-muted-foreground">Books</p>
            </div>
          </Link>
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{getQuestionCount()}</p>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dog className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Dog</p>
            </div>
          </div>
        </div>
      </section>

      <ModeSelection year={year} division={division} />

      {/* Separator */}
      <div className="max-w-2xl mx-auto my-12">
        <div className="border-t border-gray-200" />
      </div>

      {/* Contribution callout */}
      <section className="max-w-2xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-3xl">📚</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Help improve OBOB.dog!
              </h3>
              <p className="text-gray-700 mb-3">
                Interested in contributing new questions to OBOB.dog? You can
                help make it better for everyone.
              </p>
              <Link
                href="/blog/obob-dog-community"
                className="inline-flex items-center text-gray-900 font-medium hover:text-gray-700 transition-colors"
              >
                Read our contribution guide →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
