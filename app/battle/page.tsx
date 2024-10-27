"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ModeSelection from "@/components/ModeSelection";
import BookSelection from "@/components/BookSelection";
import QuizPage from "@/components/QuizPage";
import type { Book } from "@/types";

function BattleContent() {
  const searchParams = useSearchParams();
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);  // Changed from string[] to Book[]
  const [quizMode, setQuizMode] = useState<"personal" | "friend" | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode") as "personal" | "friend" | null;
    if (mode) {
      setQuizMode(mode);
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [quizMode, quizStarted]);

  const handleSelectBooks = (books: Book[]) => {  // Changed from string[] to Book[]
    setSelectedBooks(books);
    setQuizStarted(true);
  };

  const handleQuizEnd = () => {
    setQuizStarted(false);
    setSelectedBooks([]);
    setQuizMode(null);
  };

  if (quizMode === null) {
    return <ModeSelection />;
  }

  if (!quizStarted) {
    return <BookSelection onSelectBooks={handleSelectBooks} />;
  }

  return (
    <QuizPage
      selectedBooks={selectedBooks}
      quizMode={quizMode}
      onQuizEnd={handleQuizEnd}
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
