"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { SkipForward, Redo, Bone, Loader2, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { QuestionWithBook, Book } from "@/types";
import Link from "next/link";

type QuizPageProps = {
  selectedBooks: Book[]; // Changed from string[] to Book[]
  quizMode: "personal" | "friend";
  onQuizEnd: () => void;
};

const TIMER_DURATION = 15; // 15 seconds

export default function QuizPage({
  selectedBooks,
  quizMode,
  onQuizEnd,
}: QuizPageProps) {
  const [questions, setQuestions] = useState<QuestionWithBook[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const boopSound = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isMessageVisible, setIsMessageVisible] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch("/api/questions/battle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ selectedBooks }),
        });

        if (!response.ok) {
          throw new Error("Failed to load questions");
        }

        const data = await response.json();
        setQuestions(data.questions);
        setMessage(data.message);
      } catch (error) {
        console.error("Error loading questions:", error);
      }
    };

    loadQuestions();
    boopSound.current = new Audio("/boop.mp3");
  }, [selectedBooks]);

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
    setScore((prevScore) => prevScore + points);
    setAnimateScore(true);
    setTimeout(() => setAnimateScore(false), 300);
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setIsTimerRunning(false);
      setTimeLeft(TIMER_DURATION);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowAnswer(false);
    setQuizFinished(false);
    setIsTimerRunning(false);
    setTimeLeft(TIMER_DURATION);
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion && !quizFinished) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  if (quizFinished) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Quiz Finished!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-xl mb-4">
            Your final score: {score} out of {questions.length * 5}
          </p>
          <p className="text-lg mb-6">
            {score === questions.length * 5
              ? "Perfect score! You're an OBOB champion!"
              : score >= questions.length * 4
              ? "Great job! You're almost there!"
              : score >= questions.length * 3
              ? "Good effort! Keep practicing!"
              : "Nice try! There's room for improvement. Keep reading!"}
          </p>
          <Button
            onClick={restartQuiz}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Redo className="mr-2 h-4 w-4" /> Start Another Battle
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={onQuizEnd} variant="outline">
            Back to Book Selection
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {isMessageVisible && message && (
        <Card className="mb-6 bg-yellow-50 border-yellow-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Bone className="h-6 w-6 text-yellow-600 rotate-12" />
              </div>
              <p className="text-yellow-800 font-medium flex-grow">{message}</p>
              <button
                onClick={() => setIsMessageVisible(false)}
                className="text-yellow-600 hover:text-yellow-800 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* New header section above the card */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col  items-center justify-between">
          <h1 className="text-2xl font-bold mb-5">
            {quizMode === "personal" ? "Solo battle" : "Friend battle"}
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
                {score}
              </span>
            </span>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
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
                  {currentQuestion.type === "in-which-book"
                    ? `${currentQuestion.book.title} by ${currentQuestion.book.author}`
                    : currentQuestion.answer}
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
              <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 w-full">
                <Button
                  onClick={() => handleAnswer(5)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Correct (5 pts)
                </Button>
                <Button
                  onClick={() => handleAnswer(3)}
                  className="bg-neutral-400 hover:bg-neutral-500"
                >
                  Partially Correct (3 pts)
                </Button>
                <Button
                  onClick={() => handleAnswer(0)}
                  className="bg-orange-400 hover:bg-orange-500"
                >
                  Incorrect (0 pts)
                </Button>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* New skip button below the card */}
      <div className="w-full max-w-4xl mx-auto mt-4">
        <Button
          onClick={nextQuestion}
          variant="outline"
          className="w-full flex items-center justify-center"
        >
          <span>Skip Question</span>
          <SkipForward className="h-5 w-5 ml-2" />
        </Button>
      </div>
      <div className="flex items-center justify-center text-xs mt-4 text-muted-foreground">
        <Link
          href={currentQuestion.source!.link}
          className=" flex items-center gap-1 hover:text-muted-foreground/80"
          target="_blank"
        >
          {currentQuestion.source?.name}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
