import React from "react";
import { notFound } from "next/navigation";
import { getBooksWithStats } from "@/lib/books";
import { getAllQuestions } from "@/lib/questions";
import BookDetailPage from "./BookDetailPage";

type Props = {
  params: Promise<{
    year: string;
    division: string;
    book_key: string;
  }>;
};

export function generateStaticParams() {
  return [
    { year: "2024-2025", division: "3-5", book_key: "placeholder" },
    { year: "2024-2025", division: "6-8", book_key: "placeholder" },
    { year: "2025-2026", division: "3-5", book_key: "placeholder" },
    { year: "2025-2026", division: "6-8", book_key: "placeholder" },
    { year: "2025-2026", division: "9-12", book_key: "placeholder" },
  ];
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const { year, division, book_key } = resolvedParams;

  // Validate parameters
  if (!year || !division || !book_key) {
    notFound();
  }

  // Validate the specific values
  if (
    !["2024-2025", "2025-2026"].includes(year) ||
    !["3-5", "6-8", "9-12"].includes(division)
  ) {
    notFound();
  }

  let booksStats, allQuestions;
  try {
    [booksStats, allQuestions] = await Promise.all([
      getBooksWithStats(year, division),
      getAllQuestions(year, division),
    ]);
  } catch (error) {
    console.error("Error loading data:", error);
    notFound();
  }

  // Early return if no data
  if (!booksStats || !allQuestions) {
    notFound();
  }

  // Find the specific book
  const bookStats = booksStats.find((b) => b.book.book_key === book_key);
  if (!bookStats) {
    notFound();
  }

  // Filter questions for this book
  const bookQuestions = allQuestions.filter((q) => q.book_key === book_key);

  return (
    <BookDetailPage
      book={bookStats.book}
      questions={bookQuestions}
      year={year}
      division={division}
    />
  );
}
