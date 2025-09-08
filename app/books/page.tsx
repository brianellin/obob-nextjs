"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function BooksSelectionPage() {
  const [year, setYear] = useState<string>("2025-2026");
  const [division, setDivision] = useState<string>("3-5");
  const router = useRouter();

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

  // Navigate to the books page with selected year and division
  const handleViewBooks = () => {
    router.push(`/books/${year}/${division}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">OBOB Books</h1>
          <p className="text-xl text-muted-foreground">
            Select your year and division to view available books
          </p>
        </div>

        <div className="flex justify-center">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 shadow-sm space-y-6 w-full max-w-md">
            <div>
              <p className="text-sm font-medium text-gray-700 text-center mb-3">
                Pick your year
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
              <p className="text-sm font-medium text-gray-700 text-center mb-3">
                Pick your division
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

            <div className="pt-4">
              <Button
                onClick={handleViewBooks}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                View Books
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
