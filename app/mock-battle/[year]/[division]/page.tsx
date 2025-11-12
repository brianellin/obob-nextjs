"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import QuizPage from "@/components/QuizPage";
import { Loader2 } from "lucide-react";
import type { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";

function MockBattleContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  // Extract and validate year and division
  const year = params.year as string;
  const division = params.division as string;

  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Validate parameters
  useEffect(() => {
    if (
      !["2024-2025", "2025-2026"].includes(year) ||
      !["3-5", "6-8", "9-12"].includes(division)
    ) {
      router.push("/");
    }
  }, [year, division, router]);

  // Load all books for the division
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/obob/${year}/${division}/books.json`);
        if (!response.ok) {
          throw new Error("Failed to load books");
        }
        const data = await response.json();
        const booksArray = Object.values(data.books) as Book[];
        setAllBooks(booksArray);
      } catch (error) {
        console.error("Error loading books:", error);
        toast({
          title: "Error",
          description: "Failed to load books. Please try again.",
          variant: "destructive",
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [year, division, router, toast]);

  const handleQuizEnd = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <QuizPage
      selectedBooks={allBooks}
      quizMode="mock"
      onQuizEnd={handleQuizEnd}
      questionCount={16}
      questionType="both"
      year={year}
      division={division}
    />
  );
}

export default function MockBattlePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-gray-600" /></div>}>
      <MockBattleContent />
    </Suspense>
  );
}
