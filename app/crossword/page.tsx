"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Grid3X3 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";

const currentYear = "2025-2026";

export default function CrosswordDivisionPicker() {
  const router = useRouter();
  const [division, setDivision] = useState<string>("3-5");

  const handleStart = () => {
    router.push(`/crossword/${currentYear}/${division}`);
  };

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-lg mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Grid3X3 className="h-8 w-8 text-black" />
            <h1 className="text-3xl font-bold font-serif text-black">
              Daily Crossword
            </h1>
          </div>
          <p className="text-muted-foreground">
            Select your division to get started
          </p>
        </div>

        <div className="bg-white border-2 border-black rounded-lg p-4 text-md text-black font-serif">
          <p className="font-bold mb-2">A new puzzle every day!</p>
          <p>
            Collaborate with teammates and friends to solve a crossword
            featuring content questions from all the books in your division.
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 text-center mb-3 font-heading">
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

        <Button className="w-full" size="lg" onClick={handleStart}>
          Start Crossword
        </Button>
      </div>
    </main>
  );
}
