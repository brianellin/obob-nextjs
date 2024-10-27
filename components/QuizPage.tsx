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
import { SkipForward, Redo } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { WavyUnderline } from "./WavyUnderline";
import type { Question } from "@/types";

type QuizPageProps = {
  selectedBooks: string[];
  quizMode: "personal" | "friend";
  onQuizEnd: () => void;
};

const TIMER_DURATION = 15; // 15 seconds

export default function QuizPage({
  selectedBooks,
  quizMode,
  onQuizEnd,
}: QuizPageProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const boopSound = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/questions.json")
      .then((response) => response.json())
      .then((data) => {
        const filteredQuestions = data.questions.filter(
          (q: Question) =>
            selectedBooks.includes(q.book || "") ||
            selectedBooks.some((book: string) => q.answer.includes(book))
        );
        const shuffledQuestions = filteredQuestions.sort(
          () => Math.random() - 0.5
        );
        setQuestions(shuffledQuestions.slice(0, 10));
      });

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
    return <div>Loading questions...</div>;
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
            <Redo className="mr-2 h-4 w-4" /> Start Another Quiz
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
    <Card className="w-full max-w-2xl mx-auto border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          <WavyUnderline style={4} thickness={5} color="text-lime-200">
            {quizMode === "personal" ? "Solo battle" : "Friend battle"}
          </WavyUnderline>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
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
            <span className="text-lg font-semibold">
              Question: {currentQuestionIndex + 1}/{questions.length}
            </span>
          </div>
          <Card className="bg-white shadow-lg">
            <CardContent className="p-4">
              <p className="text-xl mb-4">
                {currentQuestion.type === "in-which-book" ? (
                  <span>
                    <span className="font-bold text-blue-500">
                      In which book{" "}
                    </span>
                    {currentQuestion.text.replace(/^In which book\s*/i, "")}
                  </span>
                ) : (
                  <span>
                    In{" "}
                    <span className="font-bold text-blue-500">
                      {currentQuestion.book}
                    </span>{" "}
                    by{" "}
                    <span className="font-bold text-blue-500">
                      {currentQuestion.author}
                    </span>{" "}
                    - {currentQuestion.text}
                  </span>
                )}
              </p>
            </CardContent>
          </Card>
          {quizMode === "friend" && (
            <div className="space-y-2">
              {!isTimerRunning && !showAnswer && (
                <Button
                  onClick={handleStartTimer}
                  className="w-full bg-blue-500 hover:bg-blue-600"
                >
                  Start Timer
                </Button>
              )}
              {(isTimerRunning || showAnswer) && (
                <>
                  <Progress
                    value={((TIMER_DURATION - timeLeft) / TIMER_DURATION) * 100}
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
            <div className="bg-yellow-100 p-3 rounded-md mt-4">
              <p className="text-lg font-semibold">
                Answer: {currentQuestion.answer}
              </p>
              <p className="text-sm text-gray-600">
                Page: {currentQuestion.page}
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {quizMode === "personal" && !showAnswer ? (
          <Button
            onClick={handleShowAnswer}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            Show Answer
          </Button>
        ) : (
          (quizMode === "personal" ||
            (quizMode === "friend" && (isTimerRunning || showAnswer))) && (
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 w-full">
              <Button
                onClick={() => handleAnswer(5)}
                className="bg-green-500 hover:bg-green-600"
              >
                Correct (5 pts)
              </Button>
              <Button
                onClick={() => handleAnswer(3)}
                className="bg-yellow-500 hover:bg-yellow-600"
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
        <Separator className="my-2" />
        <Button
          onClick={nextQuestion}
          variant="outline"
          className="w-full flex items-center justify-center"
        >
          <SkipForward className="h-4 w-4 sm:mr-2" />
          <span className="ml-2 sm:ml-0">Skip Question</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
