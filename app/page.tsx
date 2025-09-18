"use client";
import { BookOpen, Dog, Zap } from "lucide-react";
import ModeSelection from "@/components/ModeSelection";
import { WavyUnderline } from "@/components/WavyUnderline";
import Link from "next/link";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState } from "react";
import questionCounts from "@/lib/question-counts.json";

export default function Home() {
  const [year, setYear] = useState<string>("2025-2026");
  const [division, setDivision] = useState<string>("3-5");

  // Handle year change and reset division if not available in new year
  const handleYearChange = (newYear: string) => {
    if (newYear) {
      setYear(newYear);
      // If switching to 2024-2025 and current division is 9-12, reset to 3-5
      if (newYear === "2024-2025" && division === "9-12") {
        setDivision("3-5");
      }
    }
  };

  // Get available divisions for the selected year
  const getAvailableDivisions = () => {
    if (year === "2024-2025") {
      return ["3-5", "6-8"];
    }
    return ["3-5", "6-8", "9-12"];
  };

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
        <h1 className="text-4xl font-bold text-center">
          <WavyUnderline style={0} thickness={6} color="text-lime-400">
            OBOB.dog{" "}
          </WavyUnderline>
        </h1>
        <p className="text-xl text-center text-muted-foreground pt-1">
          Read, practice, and have fun with Oregon Battle of the Books
        </p>

        <div className="max-w-lg mx-auto pt-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 text-center mb-3">
                Pick your battle division
              </p>
              <ToggleGroup
                type="single"
                value={year}
                onValueChange={handleYearChange}
                className="justify-center"
              >
                <ToggleGroupItem
                  value="2024-2025"
                  aria-label="2024-2025 School Year"
                  className="data-[state=on]:bg-pink-400 data-[state=on]:text-white"
                >
                  2024-2025
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="2025-2026"
                  aria-label="2025-2026 School Year"
                  className="data-[state=on]:bg-pink-400 data-[state=on]:text-white relative"
                >
                  2025-2026
                  {year === "2025-2026" && (
                    <span
                      className="absolute -top-2 -right-2 text-2xl animate-bounce drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]"
                      style={{
                        filter: "drop-shadow(0 0 3px rgba(255,255,255,0.9))",
                      }}
                    >
                      🥳
                    </span>
                  )}
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
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
                {getAvailableDivisions().includes("9-12") && (
                  <ToggleGroupItem
                    value="9-12"
                    aria-label="High School Division"
                    className="data-[state=on]:bg-black data-[state=on]:text-white"
                  >
                    High
                  </ToggleGroupItem>
                )}
              </ToggleGroup>
            </div>
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
    </main>
  );
}
