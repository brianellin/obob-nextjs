"use client";

import React, { useState, useEffect } from "react";
import ModeSelection from "@/components/ModeSelection";
import BookSelection from "@/components/BookSelection";
import QuizPage from "@/components/QuizPage";

export default function Home() {
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [quizMode, setQuizMode] = useState<"personal" | "friend" | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [quizMode, quizStarted]);

  const handleSelectMode = (mode: "personal" | "friend") => {
    setQuizMode(mode);
  };

  const handleSelectBooks = (books: string[]) => {
    setSelectedBooks(books);
    setQuizStarted(true);
  };

  const handleQuizEnd = () => {
    setQuizStarted(false);
    setSelectedBooks([]);
    setQuizMode(null);
  };

  return (
    <main className="min-h-screen bg-white p-4">
      {quizMode === null ? (
        <ModeSelection onSelectMode={handleSelectMode} />
      ) : !quizStarted ? (
        <BookSelection onSelectBooks={handleSelectBooks} />
      ) : (
        <QuizPage
          selectedBooks={selectedBooks}
          quizMode={quizMode}
          onQuizEnd={handleQuizEnd}
        />
      )}
    </main>
  );
}
