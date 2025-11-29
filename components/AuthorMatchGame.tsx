"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Book } from "@/types";
import MatchCard, { MatchCardData } from "./MatchCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, RotateCcw, Home, MousePointerClick } from "lucide-react";
import Link from "next/link";
import { usePostHog } from "posthog-js/react";

interface AuthorMatchGameProps {
  books: Book[];
  year: string;
  division: string;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function AuthorMatchGame({ books, year, division }: AuthorMatchGameProps) {
  const posthog = usePostHog();
  const [cards, setCards] = useState<MatchCardData[]>([]);
  const [flippedCardIds, setFlippedCardIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [nextColorIndex, setNextColorIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTrackedStart = useRef(false);

  // Initialize cards
  const initializeGame = useCallback(() => {
    const newCards: MatchCardData[] = [];

    books.forEach((book) => {
      // Title card
      newCards.push({
        id: `title-${book.book_key}`,
        bookKey: book.book_key,
        type: "title",
        content: book.title,
        isFlipped: false,
        isMatched: false,
      });

      // Author card
      newCards.push({
        id: `author-${book.book_key}`,
        bookKey: book.book_key,
        type: "author",
        content: book.author,
        isFlipped: false,
        isMatched: false,
      });
    });

    setCards(shuffleArray(newCards));
    setFlippedCardIds([]);
    setAttempts(0);
    setStartTime(null);
    setElapsedTime(0);
    setGameComplete(false);
    setIsChecking(false);
    setNextColorIndex(0);
    hasTrackedStart.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [books]);

  useEffect(() => {
    initializeGame();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [initializeGame]);

  // Timer effect
  useEffect(() => {
    if (startTime && !gameComplete) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [startTime, gameComplete]);

  // Check for game completion
  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      setGameComplete(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Track completion
      posthog?.capture("authorMatchCompleted", {
        year,
        division,
        bookCount: books.length,
        timeSeconds: elapsedTime / 1000,
        attempts,
      });
    }
  }, [cards, posthog, year, division, books.length, elapsedTime, attempts]);

  const handleCardClick = (cardId: string) => {
    if (isChecking || gameComplete) return;

    const clickedCard = cards.find((c) => c.id === cardId);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    // Start timer on first flip
    if (!startTime) {
      setStartTime(Date.now());
      if (!hasTrackedStart.current) {
        posthog?.capture("authorMatchStarted", {
          year,
          division,
          bookCount: books.length,
        });
        hasTrackedStart.current = true;
      }
    }

    // Flip the card
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, isFlipped: true } : card
      )
    );

    const newFlippedIds = [...flippedCardIds, cardId];
    setFlippedCardIds(newFlippedIds);

    // If two cards are flipped, check for match
    if (newFlippedIds.length === 2) {
      setAttempts((prev) => prev + 1);
      setIsChecking(true);

      const [firstId, secondId] = newFlippedIds;
      const firstCard = cards.find((c) => c.id === firstId);
      const secondCard = cards.find((c) => c.id === secondId);

      if (
        firstCard &&
        secondCard &&
        firstCard.bookKey === secondCard.bookKey &&
        firstCard.type !== secondCard.type
      ) {
        // Match found! Assign a color to this pair
        const colorIndex = nextColorIndex;
        setNextColorIndex((prev) => prev + 1);

        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === firstId || card.id === secondId
                ? { ...card, isMatched: true, colorIndex }
                : card
            )
          );
          setFlippedCardIds([]);
          setIsChecking(false);
        }, 500);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === firstId || card.id === secondId
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCardIds([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const matchedCount = cards.filter((c) => c.isMatched).length / 2;
  const totalPairs = books.length;

  if (gameComplete) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Great job!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 mx-auto text-gray-500 mb-2" />
                <p className="text-sm text-gray-500">Time</p>
                <p className="text-2xl font-bold">{formatTime(elapsedTime)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <MousePointerClick className="w-6 h-6 mx-auto text-gray-500 mb-2" />
                <p className="text-sm text-gray-500">Attempts</p>
                <p className="text-2xl font-bold">{attempts}</p>
              </div>
            </div>
            <p className="text-center text-gray-600">
              You matched all {totalPairs} book-author pairs!
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={initializeGame}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span className="font-mono text-lg font-semibold">
            {formatTime(elapsedTime)}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {matchedCount} / {totalPairs} matched
        </div>
        <div className="flex items-center gap-2">
          <MousePointerClick className="w-5 h-5 text-gray-500" />
          <span className="font-semibold">{attempts}</span>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
        {cards.map((card) => (
          <MatchCard
            key={card.id}
            card={card}
            onClick={() => handleCardClick(card.id)}
            disabled={isChecking || flippedCardIds.length >= 2}
          />
        ))}
      </div>

      {/* Instructions */}
      {!startTime && (
        <p className="text-center text-gray-500 text-sm">
          Tap a card to begin! Match each book title with its author.
        </p>
      )}
    </div>
  );
}
