"use client";

import React, { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import VibeCheckGame from "@/components/VibeCheckGame";
import { Loader2 } from "lucide-react";
import type { Book } from "@/types";

function VibeCheckContent() {
  const params = useParams();
  const router = useRouter();
  const year = params.year as string;
  const division = params.division as string;

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !["2024-2025", "2025-2026"].includes(year) ||
      !["3-5", "6-8", "9-12"].includes(division)
    ) {
      router.push("/");
      return;
    }

    // Load books for this division
    const loadBooks = async () => {
      try {
        const response = await fetch(`/obob/${year}/${division}/books.json`);
        const data = await response.json();
        setBooks(Object.values(data.books) as Book[]);
      } catch (error) {
        console.error("Failed to load books:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [year, division, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <VibeCheckGame
      books={books}
      year={year}
      division={division}
      onExit={() => router.push(`/battle/${year}/${division}`)}
    />
  );
}

export default function VibeCheckPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
        </div>
      }
    >
      <VibeCheckContent />
    </Suspense>
  );
}
