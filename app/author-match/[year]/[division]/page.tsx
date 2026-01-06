"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2, Grid2X2 } from "lucide-react";
import type { Book } from "@/types";
import { useToast } from "@/hooks/use-toast";
import AuthorMatchGame from "@/components/AuthorMatchGame";
import { WavyUnderline } from "@/components/WavyUnderline";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

function AuthorMatchContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const year = params.year as string;
  const division = params.division as string;

  const [books, setBooks] = useState<Book[]>([]);
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

  // Load books for the division
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
        setBooks(booksArray);
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  const divisionLabel =
    division === "3-5"
      ? "Elementary (3-5)"
      : division === "6-8"
      ? "Middle (6-8)"
      : "High (9-12)";

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-2">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Home
          </Button>
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <Grid2X2 className="h-8 w-8 text-green-500" />
          <h1 className="text-2xl font-bold font-heading">
            Author{" "}
            <WavyUnderline>
              <span className="text-green-500">Match</span>
            </WavyUnderline>
          </h1>
        </div>
        <p className="text-gray-500 text-sm">
          {year} &bull; {divisionLabel} &bull; {books.length} pairs
        </p>
      </div>

      <AuthorMatchGame books={books} year={year} division={division} />
    </div>
  );
}

export default function AuthorMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
        </div>
      }
    >
      <AuthorMatchContent />
    </Suspense>
  );
}
