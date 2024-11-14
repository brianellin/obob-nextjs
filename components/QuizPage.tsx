"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkipForward, Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { QuestionWithBook, Book } from "@/types";
import Link from "next/link";
import { WavyUnderline } from "./WavyUnderline";
import { useToast } from "@/hooks/use-toast";

type QuizPageProps = {
  selectedBooks: Book[];
  quizMode: "personal" | "friend";
  onQuizEnd: () => void;
  questionCount: number;
  questionType: "in-which-book" | "content" | "both";
  year: string;
  division: string;
};

const TIMER_DURATION = 15; // 15 seconds

type QuestionResult = {
  question: QuestionWithBook;
  pointsAwarded: number;
};

// Add this function outside the component
async function fetchQuestionsFromAPI(
  selectedBooks: Book[],
  questionCount: number,
  questionType: "in-which-book" | "content" | "both",
  year: string,
  division: string
) {
  const response = await fetch("/api/questions/battle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedBooks,
      questionCount,
      questionType,
      year,
      division,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }

  return response.json();
}

export default function QuizPage({
  selectedBooks,
  quizMode,
  onQuizEnd,
  questionCount,
  questionType,
  year,
  division,
}: QuizPageProps) {
  const [questions, setQuestions] = useState<QuestionWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const boopSound = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const { toast } = useToast();

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await fetchQuestionsFromAPI(
        selectedBooks,
        questionCount,
        questionType,
        year,
        division
      );
      if (data.message) {
        toast({
          title: "Note",
          description: data.message,
        });
      }
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [selectedBooks, questionCount, questionType, year, division]);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsTimerRunning(false);
            setShowAnswer(true);
            boopSound.current?.play();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      setShowAnswer(true);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timeLeft]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setTimeLeft(TIMER_DURATION);
    setShowAnswer(false);
  };

  const handleAnswer = (points: number) => {
    setAnimateScore(true);

    // Update or add the result for the current question
    setQuestionResults((prev) => {
      const newResults = [...prev];
      newResults[currentQuestionIndex] = {
        question: currentQuestion,
        pointsAwarded: points,
      };
      return newResults;
    });

    setTimeout(() => setAnimateScore(false), 300);
    nextQuestion();
  };

  const nextQuestion = () => {
    // Record the skip if there's no existing result
    setQuestionResults((prev) => {
      const newResults = [...prev];
      if (!newResults[currentQuestionIndex]) {
        newResults[currentQuestionIndex] = {
          question: currentQuestion,
          pointsAwarded: -1, // Using -1 to indicate a skip
        };
      }
      return newResults;
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setIsTimerRunning(false);
      setTimeLeft(TIMER_DURATION);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = async () => {
    await loadQuestions(); // Fetch new questions
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setQuizFinished(false);
    setIsTimerRunning(false);
    setTimeLeft(TIMER_DURATION);
    setQuestionResults([]);
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowAnswer(false);
      setIsTimerRunning(false);
      setTimeLeft(TIMER_DURATION);
    } else {
      onQuizEnd();
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  console.log(`currentQuestionIndex: ${currentQuestionIndex}`);
  console.log(questions);

  const calculateScore = () => {
    return questionResults.reduce((total, result) => {
      return total + (result.pointsAwarded >= 0 ? result.pointsAwarded : 0);
    }, 0);
  };

  if (quizFinished) {
    return (
      <div className="container p-4 mt-8">
        <Card className="w-full max-w-xl mx-auto drop-shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Battle complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-xl mb-4">
                Your score: {calculateScore()} out of {questions.length * 5}
              </p>
              <p className="text-lg mb-6">
                {calculateScore() === questions.length * 5
                  ? "Perfect score! You're an OBOB champion!"
                  : calculateScore() >= questions.length * 4
                  ? "Great job! You're almost there!"
                  : calculateScore() >= questions.length * 3
                  ? "Good effort! Keep practicing!"
                  : "Nice try! There's room for improvement. Keep reading!"}
              </p>
            </div>

            <div className="justify-center flex gap-4 flex-col mb-8">
              <Button
                onClick={restartQuiz}
                className="bg-purple-500 hover:bg-purple-600 w-full"
              >
                Battle again with same books
              </Button>
              <Button onClick={onQuizEnd} variant="outline" className="w-full">
                Start over
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Battle review:</h3>
              {questionResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">Question {index + 1}:</p>
                      <p className="text-sm text-gray-600">
                        {result.question.type === "in-which-book"
                          ? `In which book ${result.question.text}`
                          : `In ${result.question.book.title}: ${result.question.text}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      {/* New header section above the card */}
      <div className="w-full max-w-xl mx-auto">
        <div className="flex flex-col  items-center justify-between">
          <h1 className="text-2xl font-bold mb-7">
            {quizMode === "personal" ? (
              <WavyUnderline style={0} thickness={4} color="text-purple-500">
                Solo battle
              </WavyUnderline>
            ) : (
              <WavyUnderline style={0} thickness={5} color="text-violet-700">
                Friend battle
              </WavyUnderline>
            )}
          </h1>

          <div className="w-full flex items-center justify-between gap-4 mb-2 px-1 ">
            <span className="text-lg font-semibold">
              Question: {currentQuestionIndex + 1}/{questions.length}
            </span>
            <span className="text-lg font-semibold">
              Score:
              <span
                className={`ml-2 inline-block ${
                  animateScore ? "animate-score-pop" : ""
                }`}
              >
                {calculateScore()}/{questions.length * 5}
              </span>
            </span>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-xl mx-auto drop-shadow-md">
        <CardContent className="p-6 mb-0">
          <div className="">
            <div>
              <p className="text-xl mb-4">
                {currentQuestion.type === "in-which-book" ? (
                  <span>
                    <span className="font-bold">In which book </span>
                    {currentQuestion.text}
                  </span>
                ) : (
                  <span>
                    In{" "}
                    <span className="font-bold">
                      {currentQuestion.book.title}
                    </span>{" "}
                    by{" "}
                    <span className="font-bold">
                      {currentQuestion.book.author}
                    </span>{" "}
                    <span className="pt-4 block">
                      {currentQuestion.text.charAt(0).toUpperCase() +
                        currentQuestion.text.slice(1)}
                    </span>
                  </span>
                )}
              </p>
            </div>
            {quizMode === "friend" && (
              <div className="space-y-2">
                {!isTimerRunning && !showAnswer && (
                  <Button
                    onClick={handleStartTimer}
                    className="w-full bg-cyan-400 hover:bg-cyan-500"
                  >
                    Start Timer
                  </Button>
                )}
                {(isTimerRunning || showAnswer) && (
                  <>
                    <Progress
                      value={
                        ((TIMER_DURATION - timeLeft) / TIMER_DURATION) * 100
                      }
                      className="w-full h-3"
                    />
                    <p className="text-center font-semibold">
                      {timeLeft > 0 ? `Time left: ${timeLeft}s` : "Time's up!"}
                    </p>
                  </>
                )}
              </div>
            )}
            {((quizMode === "personal" && showAnswer) ||
              (quizMode === "friend" && (showAnswer || isTimerRunning))) && (
              <div className="bg-slate-100 p-3 rounded-md my-4">
                <p className="text-lg font-medium">
                  {currentQuestion.type === "in-which-book" ? (
                    <span>
                      <span className="font-semibold">
                        {currentQuestion.book.title}
                      </span>{" "}
                      by{" "}
                      <span className="font-semibold">
                        {currentQuestion.book.author}
                      </span>
                    </span>
                  ) : (
                    currentQuestion.answer.charAt(0).toUpperCase() +
                    currentQuestion.answer.slice(1)
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Page: {currentQuestion.page}
                </p>
              </div>
            )}
          </div>

          {quizMode === "personal" && !showAnswer ? (
            <Button
              onClick={handleShowAnswer}
              className="w-full bg-cyan-400 hover:bg-cyan-500"
            >
              Show Answer
            </Button>
          ) : (
            (quizMode === "personal" ||
              (quizMode === "friend" && (isTimerRunning || showAnswer))) && (
              <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 w-full">
                <Button
                  onClick={() => handleAnswer(5)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Correct (5 pts)
                </Button>
                <Button
                  onClick={() => handleAnswer(3)}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Partially Correct (3 pts)
                </Button>
                <Button
                  onClick={() => handleAnswer(0)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Incorrect (0 pts)
                </Button>
              </div>
            )
          )}
          <div className="flex items-center justify-center text-xs gap-1 mt-4 text-muted-foreground">
            Source:{" "}
            <Link
              href={currentQuestion.source!.link}
              className=" flex items-center gap-1 hover:text-muted-foreground/80"
              target="_blank"
            >
              {currentQuestion.source?.name}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* New skip button below the card */}
      <div className="w-full max-w-xl mx-auto mt-4 flex gap-2">
        <Button
          onClick={previousQuestion}
          variant="outline"
          className="w-full flex items-center justify-center touch-none"
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          <span>Back</span>
        </Button>
        <Button
          onClick={nextQuestion}
          variant="outline"
          className="w-full flex items-center justify-center touch-none"
        >
          <span>Skip</span>
          <SkipForward className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
