"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { CheckCircle, XCircle, SkipForward, Redo } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);

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
  }, [selectedBooks]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleAnswer = (points: number) => {
    setScore((prevScore) => prevScore + points);
    setAnimateScore(true);
    setTimeout(() => setAnimateScore(false), 300); // Reset animation after 300ms
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowAnswer(false);
    setQuizFinished(false);
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">
          OBOB Quiz - Personal Mode
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
            </CardContent>
          </Card>
          {showAnswer && (
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
        {!showAnswer ? (
          <Button
            onClick={handleShowAnswer}
            className="w-full bg-blue-500 hover:bg-blue-600"
          >
            Show Answer
          </Button>
        ) : (
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
