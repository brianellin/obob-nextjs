"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import QuizPage from "@/components/QuizPage";
import { Loader2, Trophy } from "lucide-react";
import type { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WavyUnderline } from "@/components/WavyUnderline";
import { Checkbox } from "@/components/ui/checkbox";

function MockBattleContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  // Extract and validate year and division
  const year = params.year as string;
  const division = params.division as string;

  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(true);
  const [stealsEnabled, setStealsEnabled] = useState(true);

  // Validate parameters
  useEffect(() => {
    if (
      !["2024-2025", "2025-2026"].includes(year) ||
      !["3-5", "6-8", "9-12"].includes(division)
    ) {
      router.push("/");
    }
  }, [year, division, router]);

  // Load all books for the division
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/obob/${year}/${division}/books.json`);
        if (!response.ok) {
          throw new Error("Failed to load books");
        }
        const data = await response.json();
        const booksArray = Object.values(data.books) as Book[];
        setAllBooks(booksArray);
      } catch (error) {
        console.error("Error loading books:", error);
        toast({
          title: "Error",
          description: "Failed to load books. Please try again.",
          variant: "destructive",
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [year, division, router, toast]);

  const handleQuizEnd = () => {
    setShowSettings(true);
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleStartBattle = () => {
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <Card className="w-full max-w-2xl mx-auto drop-shadow-md">
          <CardHeader>
            <div className="text-center mb-4">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-orange-500" />
              <CardTitle className="text-3xl font-bold mb-2">
                <WavyUnderline style={0} thickness={5} color="text-orange-500">
                  Mock Battle Setup
                </WavyUnderline>
              </CardTitle>
              <CardDescription className="text-base">
                Configure your battle settings before starting
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-lg">Battle Details:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>16 total questions (8 in-which-book, 8 content)</li>
                <li>Teams alternate questions</li>
                <li>15-second timer per question</li>
                <li>Using all {allBooks.length} books from this division</li>
              </ul>
            </div>

            <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="steals"
                  checked={stealsEnabled}
                  onCheckedChange={(checked) => setStealsEnabled(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="steals"
                    className="font-semibold text-base cursor-pointer block"
                  >
                    Enable steal opportunities
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    When enabled, if a team answers incorrectly (0 pts), the other team gets a chance to steal the question and earn points.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleBackToHome}
                variant="outline"
                className="flex-1"
              >
                Back to Home
              </Button>
              <Button
                onClick={handleStartBattle}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                Start Battle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <QuizPage
      selectedBooks={allBooks}
      quizMode="mock"
      onQuizEnd={handleQuizEnd}
      questionCount={16}
      questionType="both"
      year={year}
      division={division}
      stealsEnabled={stealsEnabled}
    />
  );
}

export default function MockBattlePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-gray-600" /></div>}>
      <MockBattleContent />
    </Suspense>
  );
}
