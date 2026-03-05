"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Grid3X3 } from "lucide-react";
import ReadOnlyCrossword from "@/components/daily-crossword/ReadOnlyCrossword";
import type { SerializedCrosswordPuzzle } from "@/lib/daily-crossword/types";

function formatDateDisplay(dateString: string): string {
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDivisionLabel(division: string): string {
  switch (division) {
    case "3-5":
      return "Elementary (3-5)";
    case "6-8":
      return "Middle School (6-8)";
    case "9-12":
      return "High School (9-12)";
    default:
      return division;
  }
}

export default function ArchivePuzzlePage() {
  const params = useParams();
  const router = useRouter();
  const year = params.year as string;
  const division = params.division as string;
  const date = params.date as string;

  const [puzzle, setPuzzle] = useState<SerializedCrosswordPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPuzzle() {
      try {
        const res = await fetch(
          `/api/daily-crossword/archive/${date}?year=${year}&division=${division}`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load puzzle");
        }
        const data = await res.json();
        setPuzzle(data.puzzle);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load puzzle");
      } finally {
        setLoading(false);
      }
    }
    loadPuzzle();
  }, [year, division, date]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error || !puzzle) {
    return (
      <main className="min-h-screen bg-white py-8">
        <div className="max-w-lg mx-auto p-4 text-center space-y-4">
          <p className="text-red-600">{error || "Puzzle not found"}</p>
          <button
            onClick={() => router.push(`/crossword/${year}/${division}`)}
            className="underline text-gray-600"
          >
            Back to today&apos;s crossword
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/crossword/${year}/${division}`)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </button>
        </div>

        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-3">
            <Grid3X3 className="h-7 w-7 text-black" />
            <h1 className="text-2xl font-bold font-serif text-black">
              {formatDateDisplay(date)}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            {getDivisionLabel(division)} &bull; Answer Key
          </p>
        </div>

        <ReadOnlyCrossword puzzle={puzzle} />
      </div>
    </main>
  );
}
