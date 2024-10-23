"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";

type Question = {
  type: "in-which-book" | "content";
  text: string;
  book?: string;
  author?: string;
  answer: string;
  page: number;
};

type QuizPageProps = {
  selectedBooks: string[];
  quizMode: "personal" | "friend";
  onQuizEnd: () => void;
};

export default function QuizPage({
  selectedBooks,
  quizMode,
  onQuizEnd,
}: QuizPageProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAnswering, setIsAnswering] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [progressWidth, setProgressWidth] = useState(100);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Fetch questions from your JSON file or API
    fetch("/questions.json")
      .then((response) => response.json())
      .then((data) => {
        const filteredQuestions = data.questions.filter(
          (q: Question) =>
            selectedBooks.includes(q.book || "") ||
            selectedBooks.some((book: string) => q.answer.includes(book))
        );
        setQuestions(filteredQuestions);
      });
  }, [selectedBooks]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentQuestionIndex]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAnswering && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft((prev) => prev - 0.1);
        setProgressWidth((prev) => Math.max(prev - 100 / 150, 0));
      }, 100);
    } else if (timeLeft <= 0) {
      setIsAnswering(false);
      setShowAnswer(true);
    }
    return () => clearTimeout(timer);
  }, [isAnswering, timeLeft]);

  const startAnswering = () => {
    setIsAnswering(true);
    setTimeLeft(15);
    setProgressWidth(100);
    setShowAnswer(false);
  };

  const handleAnswer = (correct: boolean) => {
    setIsAnswering(false);
    if (correct) {
      setScore(score + 5);
    }
    setShowAnswer(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else {
      // Quiz finished
      alert(`Quiz finished! Final score: ${score}`);
      onQuizEnd();
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (!currentQuestion) {
    return <div>Loading questions...</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          OBOB Quiz - {quizMode === "personal" ? "Personal" : "Friend"} Mode
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Score: {score}</span>
            <span className="text-lg font-semibold">
              Question: {currentQuestionIndex + 1}/{questions.length}
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
              {showAnswer && (
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
          {quizMode === "personal" && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-100 ease-linear"
                  style={{ width: `${progressWidth}%` }}
                ></div>
              </div>
              <p className="text-center font-semibold">
                Time left: {Math.ceil(timeLeft)}s
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <div className="flex justify-center space-x-4 p-4">
        {quizMode === "personal" ? (
          <>
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
            {showAnswer && (
              <Button
                onClick={nextQuestion}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Next Question
              </Button>
            )}
          </>
        ) : (
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
            <Button
              onClick={nextQuestion}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Next Question
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
