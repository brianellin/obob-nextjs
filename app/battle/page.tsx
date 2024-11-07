"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ModeSelection from "@/components/ModeSelection";
import BookSelection from "@/components/BookSelection";
import QuizPage from "@/components/QuizPage";
import type { Book } from "@/types";

type QuestionType = "in-which-book" | "content" | "both";

function BattleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [quizMode, setQuizMode] = useState<"personal" | "friend" | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(16);
  const [questionType, setQuestionType] = useState<QuestionType>("both");

  useEffect(() => {
    const mode = searchParams.get("mode") as "personal" | "friend" | null;
    if (mode) {
      setQuizMode(mode);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [quizMode, quizStarted]);

  const handleSelectBooks = (
    books: Book[], 
    count: number,
    type: QuestionType
  ) => {
    setSelectedBooks(books);
    setQuestionCount(count);
    setQuestionType(type);
    setQuizStarted(true);
  };

  const handleQuizEnd = () => {
    setQuizStarted(false);
    setSelectedBooks([]);
    setQuizMode(null);
    setQuestionCount(16);
    setQuestionType("both");
    router.push("/battle");
  };

  if (quizMode === null) {
    return (
      <div className="container max-w-2xl mx-auto mt-8">
        <ModeSelection />
      </div>
    );
  }

  if (!quizStarted) {
    return <BookSelection onSelectBooks={handleSelectBooks} />;
  }

  return (
    <QuizPage
      selectedBooks={selectedBooks}
      quizMode={quizMode}
      onQuizEnd={handleQuizEnd}
      questionCount={questionCount}
      questionType={questionType}
    />
  );
}

export default function BattlePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BattleContent />
    </Suspense>
  );
}
