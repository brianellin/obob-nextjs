"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuestionWithBook } from "@/types";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { Trophy, Award } from "lucide-react";

type QuestionResult = {
  question: QuestionWithBook;
  pointsAwarded: number;
  team?: "A" | "B";
  stolenBy?: "A" | "B";
};

type MockBattleResultsProps = {
  questionResults: QuestionResult[];
  questions: QuestionWithBook[];
  teamAScore: number;
  teamBScore: number;
  onRestart: () => void;
  onEnd: () => void;
};

// Helper function to lowercase the first character of a string
function lowercaseFirstChar(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Helper components for colored team labels
function TeamALabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-pink-500 font-semibold">
      {children}
    </span>
  );
}

function TeamBLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-lime-500 font-semibold">
      {children}
    </span>
  );
}

export default function MockBattleResults({
  questionResults,
  questions,
  teamAScore,
  teamBScore,
  onRestart,
  onEnd,
}: MockBattleResultsProps) {
  const { width, height } = useWindowSize();

  const winner = teamAScore > teamBScore ? "A" : teamBScore > teamAScore ? "B" : "tie";
  const maxScore = questions.length * 5;

  return (
    <div className="container p-4 mt-8">
      {/* Show confetti if there's a clear winner with a good score */}
      {winner !== "tie" && Math.max(teamAScore, teamBScore) >= maxScore * 0.7 && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      <Card className="w-full max-w-2xl mx-auto drop-shadow-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Mock Battle Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Winner announcement */}
          <div className="text-center mb-8">
            {winner === "tie" ? (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Award className="h-12 w-12 text-yellow-500" />
                <h2 className="text-3xl font-bold text-gray-700 font-heading">It&apos;s a Tie!</h2>
                <Award className="h-12 w-12 text-yellow-500" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Trophy className="h-12 w-12 text-yellow-500" />
                <h2 className="text-3xl font-bold text-green-600 font-heading">
                  {winner === "A" ? <TeamALabel>Odds</TeamALabel> : <TeamBLabel>Evens</TeamBLabel>} Win!
                </h2>
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
            )}
          </div>

          {/* Score display */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div
              className={`p-6 rounded-lg border-4 ${
                winner === "A"
                  ? "bg-green-50 border-green-500"
                  : winner === "tie"
                  ? "bg-yellow-50 border-yellow-500"
                  : "bg-gray-50 border-gray-300"
              }`}
            >
              <h3 className="text-xl font-bold text-center mb-2 font-heading"><TeamALabel>Odds</TeamALabel></h3>
              <p className="text-4xl font-bold text-center">{teamAScore}</p>
            </div>
            <div
              className={`p-6 rounded-lg border-4 ${
                winner === "B"
                  ? "bg-green-50 border-green-500"
                  : winner === "tie"
                  ? "bg-yellow-50 border-yellow-500"
                  : "bg-gray-50 border-gray-300"
              }`}
            >
              <h3 className="text-xl font-bold text-center mb-2 font-heading"><TeamBLabel>Evens</TeamBLabel></h3>
              <p className="text-4xl font-bold text-center">{teamBScore}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="justify-center flex gap-4 flex-col mb-8">
            <Button
              onClick={onRestart}
              className="bg-orange-500 hover:bg-orange-600 w-full"
            >
              Battle again with same books
            </Button>
            <Button onClick={onEnd} variant="outline" className="w-full">
              Back to home
            </Button>
          </div>

          {/* Question review */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg font-heading">Battle review:</h3>
            {questionResults.map((result, index) => {
              const wasStolen = !!result.stolenBy && result.pointsAwarded > 0;

              return (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">Question {index + 1}:</p>
                        <span className="text-sm font-semibold">
                          {result.team === "A" ? <TeamALabel>Odds</TeamALabel> : <TeamBLabel>Evens</TeamBLabel>}
                          {wasStolen && (
                            <span className="text-green-600"> → Stolen by {result.stolenBy === "A" ? <TeamALabel>Odds</TeamALabel> : <TeamBLabel>Evens</TeamBLabel>}!</span>
                          )}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {result.question.type === "in-which-book"
                          ? `In which book ${lowercaseFirstChar(result.question.text)}`
                          : `In ${result.question.book.title}: ${result.question.text}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-sm whitespace-nowrap ml-2 ${
                        result.pointsAwarded === 5
                          ? "bg-emerald-100 text-emerald-700"
                          : result.pointsAwarded === 3
                          ? "bg-amber-100 text-amber-700"
                          : result.pointsAwarded === -1
                          ? "bg-gray-100 text-gray-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.pointsAwarded === -1
                        ? "Skipped"
                        : `${result.pointsAwarded} pts`}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    Answer:{" "}
                    {result.question.type === "in-which-book"
                      ? `${result.question.book.title} by ${result.question.book.author}`
                      : result.question.answer}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
