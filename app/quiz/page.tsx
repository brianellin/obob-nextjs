"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import BookSelection from "@/components/BookSelection";
import ModeSelection from "@/components/ModeSelection";

type Question = {
  type: "in-which-book" | "content";
  text: string;
  book?: string;
  author?: string;
  answer: string;
  page: number;
};

type Mode = "personal" | "friend";

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isAnswering, setIsAnswering] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const QUESTION_TIME = 15; // seconds

  useEffect(() => {
    fetch("/questions.json")
      .then((response) => response.json())
      .then((data) => setQuestions(data.questions));
  }, []);

  const handleSelectMode = (selectedMode: Mode) => {
    setMode(selectedMode);
  };

  const handleSelectBooks = (selectedBooks: string[]) => {
    const filtered = questions.filter(
      (q) =>
        selectedBooks.includes(q.book || "") ||
        selectedBooks.some((book) => q.answer.includes(book))
    );
    setFilteredQuestions(filtered);
    setQuizStarted(true);
  };

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnswering && timeElapsed < QUESTION_TIME) {
      timer = setTimeout(
        () => setTimeElapsed((prev) => Math.min(prev + 0.1, QUESTION_TIME)),
        100
      );
    } else if (timeElapsed >= QUESTION_TIME) {
      setIsAnswering(false);
      if (mode === "personal") {
        setShowAnswer(true);
      }
    }
    return () => clearTimeout(timer);
  }, [isAnswering, timeElapsed, mode]);

  const startAnswering = () => {
    setIsAnswering(true);
    setTimeElapsed(0);
    setShowAnswer(false);
  };

  const handleAnswer = (correct: boolean) => {
    setIsAnswering(false);
    if (correct) {
      setScore(score + 5);
    }
    if (mode === "personal") {
      setShowAnswer(true);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else {
      // Quiz finished
      alert(`Quiz finished! Final score: ${score}`);
      setQuizStarted(false);
      setCurrentQuestionIndex(0);
      setScore(0);
      setMode(null);
    }
  };

  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              OBOB Quiz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ModeSelection onSelectMode={handleSelectMode} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 p-4 flex flex-col items-center justify-center">
        <BookSelection onSelectBooks={handleSelectBooks} />
      </div>
    );
  }

  if (!currentQuestion) {
    return <div>Loading questions...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-green-100 p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            OBOB Quiz - {mode === "personal" ? "Personal" : "Friend"} Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">Score: {score}</span>
              <span className="text-lg font-semibold">
                Question: {currentQuestionIndex + 1}/{filteredQuestions.length}
              </span>
            </div>
            <Card className="bg-white shadow-lg">
              <CardContent className="p-4">
                <p className="text-lg font-medium mb-2">
                  {currentQuestion.type === "in-which-book" ? (
                    <span className="font-bold text-blue-500">
                      In which book...
                    </span>
                  ) : (
                    <span className="font-bold text-green-500">
                      {currentQuestion.book} by {currentQuestion.author}
                    </span>
                  )}
                </p>
                <p className="text-xl mb-4">{currentQuestion.text}</p>
                {(mode === "friend" || showAnswer) && (
                  <div className="bg-yellow-100 p-3 rounded-md">
                    <p className="text-lg font-semibold">
                      Answer: {currentQuestion.answer}
                    </p>
                    <p className="text-sm text-gray-600">
                      Page: {currentQuestion.page}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            {isAnswering && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-100 ease-linear"
                    style={{ width: `${(timeElapsed / QUESTION_TIME) * 100}%` }}
                  ></div>
                </div>
                <p className="text-center font-semibold">
                  Time left: {Math.ceil(QUESTION_TIME - timeElapsed)}s
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          {!isAnswering && !showAnswer && (
            <Button
              onClick={startAnswering}
              className="bg-green-500 hover:bg-green-600"
            >
              Start Timer
            </Button>
          )}
          {isAnswering && (
            <>
              <Button
                onClick={() => handleAnswer(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="mr-2" /> Correct
              </Button>
              <Button
                onClick={() => handleAnswer(false)}
                className="bg-red-500 hover:bg-red-600"
              >
                <XCircle className="mr-2" /> Incorrect
              </Button>
            </>
          )}
          {(mode === "friend" || showAnswer) && (
            <Button
              onClick={nextQuestion}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Next Question
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
