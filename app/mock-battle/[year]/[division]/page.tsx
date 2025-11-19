"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import QuizPage from "@/components/QuizPage";
import { Loader2, Trophy, Clock, Zap, Microscope, Award } from "lucide-react";
import type { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  const [battleMode, setBattleMode] = useState<"micro" | "mini" | "regular">("regular");

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
            <div className="text-center ">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-orange-500" />
              <CardTitle className="text-3xl font-bold mb-2">
                <WavyUnderline style={0} thickness={5} color="text-orange-500">
                  Mock Battle Setup
                </WavyUnderline>
              </CardTitle>
              <CardDescription className="text-base pt-1">
                Mock battles use all {allBooks.length} books, with an even mix
                of <em>in which book</em> and <em>content</em> questions
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-lg">How it works:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>
                  You will moderate this simulation of a real OBOB battle. Read
                  the questions aloud and record whether each team's responses
                  are correct, partially correct, or incorrect.{" "}
                </li>

                <li>
                  Choose which team will go first (
                  <span className="text-pink-500 font-semibold">Odds</span>) and
                  which will go second (
                  <span className="text-lime-500 font-semibold">Evens</span>).
                  Not sure? Flip a coin and have the winner choose.
                </li>

                <li>
                  Make sure each team has selected a spokesperson before
                  starting the battle.
                </li>

                <li>
                  At the end of the battle you'll get a report with how each
                  team answered each question and the total score.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-3">Battle length:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  onClick={() => setBattleMode("regular")}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    battleMode === "regular"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">Regular</h4>
                    <Award className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    16 questions, 8 per team
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    7-10 min
                  </div>
                </div>
                <div
                  onClick={() => setBattleMode("mini")}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    battleMode === "mini"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">Mini</h4>
                    <Zap className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    8 questions, 4 per team
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    4-5 min
                  </div>
                </div>
                <div
                  onClick={() => setBattleMode("micro")}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    battleMode === "micro"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">Micro</h4>
                    <Microscope className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    4 questions, 2 per team
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    2-3 min
                  </div>
                </div>
              </div>
            </div>

            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="steals"
                  checked={stealsEnabled}
                  onCheckedChange={(checked) =>
                    setStealsEnabled(checked as boolean)
                  }
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="steals"
                    className="font-semibold text-base cursor-pointer block"
                  >
                    Enable steals
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    When enabled, if a team answers incorrectly (0 pts), the
                    other team gets a chance to steal the question and earn
                    extra points.
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

  const questionCount = battleMode === "micro" ? 4 : battleMode === "mini" ? 8 : 16;

  return (
    <QuizPage
      selectedBooks={allBooks}
      quizMode="mock"
      onQuizEnd={handleQuizEnd}
      questionCount={questionCount}
      questionType="both"
      year={year}
      division={division}
      stealsEnabled={stealsEnabled}
    />
  );
}

export default function MockBattlePage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
        </div>
      }
    >
      <MockBattleContent />
    </Suspense>
  );
}
