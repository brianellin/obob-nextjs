"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Book, QuestionWithBook } from "@/types";
import Image from "next/image";
import {
  Trophy,
  Flame,
  Share2,
  RotateCcw,
  Home,
  X,
  Volume2,
  VolumeX,
  Check,
  PawPrint,
  ArrowLeft,
} from "lucide-react";
import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

type ZoomiesGameProps = {
  books: Book[];
  year: string;
  division: string;
  onExit: () => void;
};

type GamePhase = "intro" | "book-selection" | "playing" | "results";

type ZoomiesResult = {
  question: QuestionWithBook;
  correct: boolean;
  timeMs: number;
  streakAtTime: number;
};

// Fun reaction messages - mix of modern slang and retro throwbacks with emoji combos
const CORRECT_REACTIONS = [
  // Modern
  "SIGMA 🐺",
  "SLAY 💅",
  "NO CAP 🧢",
  "GOATED 🐐",
  "VALID ✅",
  "BUSSIN 🍔",
  "W 👑",
  "FIRE 🔥",
  "ELITE 💎",
  "LEGENDARY 🏆",
  "SHEESH 🥶",
  "PERIOD 💅✨",
  "MAIN CHARACTER 🌟",
  "ICONIC ⭐",
  "BIG BRAIN 🧠",
  "GALAXY BRAIN 🧠🌌",
  "CERTIFIED 📜✨",
  "IMMACULATE ✨",
  "YAAAS 👏",
  "HITS DIFFERENT 💫",
  "BASED 💯",
  "FACTS 📠",
  "UNDERSTOOD THE ASSIGNMENT 📝",
  "SERVED 🍽️",
  "CHEF'S KISS 👨‍🍳💋",
  "SLAYED 🗡️",
  "IT'S GIVING SMART 🤓",
  "RENT FREE 🏠",
  "REAL 💯",
  "LOWKEY GENIUS 🤫🧠",
  "RIZZ ✨😏",
  "SKILLZ 🎯",
  // 2000s
  "EPIC WIN 🎮",
  "YOU ROCK 🤘",
  "TOTALLY AWESOME 😎",
  "SICK 🤙",
  "SWEET 🍭",
  "BEAST MODE 🦁",
  "OWNED IT 💪",
  "FTW 🏅",
  "LEGIT 👍",
  // 90s
  "ALL THAT 💃",
  "DA BOMB 💣",
  "PHAT 🔊",
  "WORD 🗣️",
  "TIGHT 🤝",
  "FLY 🪰",
  "STELLAR ⭐",
  // 80s
  "RAD 🛹",
  "RADICAL 🏄",
  "TOTALLY TUBULAR 🌊",
  "GNARLY 🤙",
  "BODACIOUS 😎",
  "RIGHTEOUS 🙌",
  "CHOICE 👌",
  "FRESH 🍋",
  "TO THE MAX 📈",
  "COWABUNGA 🐢",
];

const WRONG_REACTIONS = [
  // Encouraging modern
  "ALMOST 😬",
  "SO CLOSE 🤏",
  "NEXT TIME 💪",
  "KEEP GOING 🏃",
  "YOU GOT THIS 👊",
  "TRY AGAIN 🔄",
  "OOPS 🙊",
  "NOT QUITE 🤔",
  "CLOSE ONE 😅",
  "GOOD TRY 👏",
  // Playful modern
  "BRUH 😐",
  "OOF 💀",
  "PLOT TWIST 🎬",
  "WHOOPS 🫣",
  "BONK 🔨",
  "YOINK 🫳",
  "NOPE 🙅",
  "HMMMM 🤨",
  "WAIT WHAT 😳",
  "HOLD UP ✋",
  "COOKED 🍳",
  "MID 😒",
  // Edgy modern (added back)
  "NAH 👎",
  "UHHH 😬",
  "RIP 🪦",
  "YIKES 😬",
  "CAP 🧢",
  "SUS 👀",
  "NOT IT 🚫",
  "CRINGE 😖",
  "FLOPPED 📉",
  "RATIO 📊",
  "SKILL ISSUE 🎮",
  "COPE 😤",
  "SIKE 🃏",
  "THAT AIN'T IT 🙈",
  "TRY AGAIN BESTIE 💅",
  "NOT THE VIBE 🚫✨",
  "READ MORE BOOKS 📚",
  "FLOP 🐟",
  "TRAGIC 😢",
  // 2000s
  "MY BAD 🤷",
  "WOMP WOMP 📯",
  "D'OH 🤦",
  "BOGUS 🛑",
  // 90s
  "AS IF 💁",
  "PSYCH 🤪",
  "WHATEVER 🙄",
  "TALK TO THE HAND ✋",
  "BOO YA... NOT 👻",
  "NOT ❌",
  "WHIFF 💨",
  // 80s
  "BUMMER 😞",
];

const STREAK_MESSAGES = [
  { min: 3, message: "ON FIRE", emoji: "🔥" },
  { min: 5, message: "UNSTOPPABLE", emoji: "⚡" },
  { min: 8, message: "LEGENDARY", emoji: "👑" },
  { min: 12, message: "GOAT STATUS", emoji: "🐐" },
  { min: 15, message: "LITERALLY UNREAL", emoji: "🌟" },
];

export default function ZoomiesGame({
  books,
  year,
  division,
  onExit,
}: ZoomiesGameProps) {
  const posthog = usePostHog();
  const { width, height } = useWindowSize();

  const [phase, setPhase] = useState<GamePhase>("intro");
  const [questions, setQuestions] = useState<QuestionWithBook[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ZoomiesResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(15000); // 15 seconds per question
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [showReaction, setShowReaction] = useState<string | null>(null);
  const [reactionType, setReactionType] = useState<"correct" | "wrong" | null>(
    null
  );
  const [showStreakPopup, setShowStreakPopup] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zoomies-sound-enabled");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>(books);
  const [bookSelectionSet, setBookSelectionSet] = useState<Set<string>>(
    () => new Set()
  );
  const [bookMultiplier, setBookMultiplier] = useState(1);

  // Timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleAnswerRef = useRef<(selectedBook: Book | null) => void>(() => {});

  // Audio refs (sounds are optional - will fail silently if not available)
  const correctSounds = useRef<HTMLAudioElement[]>([]);
  const wrongSounds = useRef<HTMLAudioElement[]>([]);
  const streakSounds = useRef<HTMLAudioElement[]>([]);

  // Sound counts
  const CORRECT_SOUND_COUNT = 8;
  const WRONG_SOUND_COUNT = 7;
  const STREAK_SOUND_COUNT = 5;

  // Play a random sound from an array
  const playRandomSound = (sounds: HTMLAudioElement[]) => {
    if (!soundEnabled || sounds.length === 0) return;
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Sound not available - fail silently
      });
    }
  };

  const QUESTION_COUNT = 15;
  const TIME_PER_QUESTION = 15000; // 15 seconds

  // Calculate book multiplier: fewer books = bigger penalty (log-ish curve)
  // 4 books = 0.25x, 8 books ≈ 0.60x, 12 books ≈ 0.81x, 16 books = 1.0x
  const calculateBookMultiplier = (
    selectedCount: number,
    totalCount: number
  ) => {
    if (totalCount <= 4) return 1; // Edge case: if only 4 books total, no penalty
    // Curve from 0.25x (min books) to 1.0x (all books)
    return 0.25 + 0.75 * Math.pow((selectedCount - 4) / (totalCount - 4), 0.7);
  };

  // Fetch questions when game starts
  const startGame = async (customBooks?: Book[]) => {
    const booksToUse = customBooks || selectedBooks;
    const isCustom =
      customBooks !== undefined && customBooks.length < books.length;
    const multiplier = calculateBookMultiplier(booksToUse.length, books.length);

    setLoading(true);
    try {
      const response = await fetch("/api/questions/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedBooks: booksToUse,
          questionCount: QUESTION_COUNT,
          questionType: "in-which-book",
          year,
          division,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch questions");

      const data = await response.json();
      setQuestions(data.questions);
      setSelectedBooks(booksToUse);
      setBookMultiplier(multiplier);
      setPhase("playing");
      setCurrentIndex(0);
      setStreak(0);
      setMaxStreak(0);
      setScore(0);
      setResults([]);
      setQuestionStartTime(Date.now());
      setTimeLeft(TIME_PER_QUESTION);
      setComboMultiplier(1);
      window.scrollTo(0, 0);

      // Track game start
      track("zoomiesStarted", {
        year,
        division,
        questionCount: QUESTION_COUNT,
        customBooks: isCustom,
        bookCount: booksToUse.length,
        bookMultiplier: multiplier,
      });
      posthog.capture("zoomiesStarted", {
        year,
        division,
        questionCount: QUESTION_COUNT,
        customBooks: isCustom,
        bookCount: booksToUse.length,
        bookMultiplier: multiplier,
      });
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setLoading(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          // Time's up - auto fail
          handleAnswerRef.current(null);
          return TIME_PER_QUESTION;
        }
        return prev - 100;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIndex]);

  // Persist sound preference to localStorage
  useEffect(() => {
    localStorage.setItem("zoomies-sound-enabled", String(soundEnabled));
  }, [soundEnabled]);

  // Get random wrong books for answer options (only from selected books)
  const getAnswerOptions = useCallback(() => {
    if (!questions[currentIndex]) return [];

    const correctBook = questions[currentIndex].book;
    const wrongBooks = selectedBooks
      .filter((b) => b.book_key !== correctBook.book_key)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [...wrongBooks, correctBook].sort(
      () => Math.random() - 0.5
    );
    return allOptions;
  }, [selectedBooks, questions, currentIndex]);

  const [answerOptions, setAnswerOptions] = useState<Book[]>([]);

  useEffect(() => {
    if (phase === "playing" && questions[currentIndex]) {
      setAnswerOptions(getAnswerOptions());
    }
  }, [currentIndex, phase, questions, getAnswerOptions]);

  const handleAnswer = (selectedBook: Book | null) => {
    if (phase !== "playing" || !questions[currentIndex]) return;

    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedBook?.book_key === currentQuestion.book.book_key;
    const responseTime = Date.now() - questionStartTime;

    // Clear timer
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score with combo and book multiplier
    let pointsEarned = 0;
    if (isCorrect) {
      // Base points + speed bonus, scaled by streak combo and book count multiplier
      const speedBonus = Math.max(
        0,
        Math.floor((TIME_PER_QUESTION - responseTime) / 100)
      );
      pointsEarned = Math.round(
        (100 + speedBonus) * comboMultiplier * bookMultiplier
      );

      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(Math.max(maxStreak, newStreak));
      setScore((prev) => prev + pointsEarned);

      // Update combo multiplier
      if (newStreak >= 10) setComboMultiplier(4);
      else if (newStreak >= 5) setComboMultiplier(2);
      else setComboMultiplier(1);

      // Show streak popup
      const streakMsg = STREAK_MESSAGES.find(
        (s) =>
          newStreak >= s.min && (newStreak === s.min || newStreak % 5 === 0)
      );
      if (streakMsg) {
        setShowStreakPopup(`${streakMsg.emoji} ${streakMsg.message}`);
        setTimeout(() => setShowStreakPopup(null), 1500);
        playRandomSound(streakSounds.current);
      }

      // Play sound
      playRandomSound(correctSounds.current);

      // Show reaction
      setReactionType("correct");
      setShowReaction(
        CORRECT_REACTIONS[Math.floor(Math.random() * CORRECT_REACTIONS.length)]
      );
    } else {
      setStreak(0);
      setComboMultiplier(1);

      playRandomSound(wrongSounds.current);

      setReactionType("wrong");
      setShowReaction(
        WRONG_REACTIONS[Math.floor(Math.random() * WRONG_REACTIONS.length)]
      );
    }

    // Record result
    setResults((prev) => [
      ...prev,
      {
        question: currentQuestion,
        correct: isCorrect,
        timeMs: responseTime,
        streakAtTime: isCorrect ? streak + 1 : 0,
      },
    ]);

    // Track answer event
    const answerData = {
      year,
      division,
      questionIndex: currentIndex + 1,
      totalQuestions: QUESTION_COUNT,
      correct: isCorrect,
      responseTimeMs: responseTime,
      timedOut: selectedBook === null,
      streak: isCorrect ? streak + 1 : 0,
      comboMultiplier,
      pointsEarned,
      bookKey: currentQuestion.book.book_key,
    };
    track("zoomiesAnswered", answerData);
    posthog.capture("zoomiesAnswered", answerData);

    // Animate and move to next
    setTimeout(() => {
      setShowReaction(null);
      setReactionType(null);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setQuestionStartTime(Date.now());
        setTimeLeft(TIME_PER_QUESTION);
      } else {
        // Game over
        setPhase("results");
        const correctCount =
          results.filter((r) => r.correct).length + (isCorrect ? 1 : 0);
        if (correctCount >= QUESTION_COUNT * 0.8) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }

        track("zoomiesFinished", {
          year,
          division,
          score,
          maxStreak,
          correctCount,
          totalQuestions: QUESTION_COUNT,
        });
        posthog.capture("zoomiesFinished", {
          year,
          division,
          score,
          maxStreak,
          correctCount,
          totalQuestions: QUESTION_COUNT,
        });
      }
    }, 1200);
  };

  // Keep the ref updated with latest handleAnswer
  useEffect(() => {
    handleAnswerRef.current = handleAnswer;
  });

  // Calculate pack rank for results
  const getPackRank = () => {
    const correctCount = results.filter((r) => r.correct).length;
    const percentage = (correctCount / results.length) * 100;

    if (percentage >= 90)
      return { rating: "TOP DOG", emoji: "🏆", color: "text-yellow-400" };
    if (percentage >= 80)
      return { rating: "VERY GOOD DOG", emoji: "⭐", color: "text-amber-400" };
    if (percentage >= 65)
      return { rating: "GOOD DOGGG", emoji: "🦴", color: "text-purple-400" };
    if (percentage >= 50)
      return {
        rating: "LEARNING NEW TRICKS",
        emoji: "🐾",
        color: "text-cyan-400",
      };
    return { rating: "OBOB PUPPY", emoji: "🐶", color: "text-gray-400" };
  };

  // Share results
  const shareResults = async () => {
    const correctCount = results.filter((r) => r.correct).length;
    const packRank = getPackRank();

    const shareText = `🐕 OBOB ZOOMIES 🐕
${packRank.emoji} ${packRank.rating} ${packRank.emoji}

Score: ${score.toLocaleString()}
Streak: ${maxStreak} 🔥
${correctCount}/${results.length} correct

Can you catch me? https://obob.dog/zoomies/${year}/${division}?utm_source=share`;

    // Track share event
    const shareData = {
      year,
      division,
      score,
      maxStreak,
      correctCount,
      totalQuestions: results.length,
      packRank: packRank.rating,
      shareMethod: "share" in navigator ? "native" : "clipboard",
    };
    track("zoomiesShare", shareData);
    posthog.capture("zoomiesShare", shareData);

    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
    }
  };

  // Intro screen
  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-cyan-50 flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4 animate-bounce">🐶</div>
          <h1 className="text-5xl italic font-black mb-2 tracking-tight bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Zoomies!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Super fast <span className="italic">in which book</span> questions
          </p>

          <div className="space-y-4 text-left bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-2xl p-6 mb-8 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👆</span>
              <span>Tap the correct book cover</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <span>15 seconds per question</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <span>Build streaks for bonus points</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <span>Earn your pack rank</span>
            </div>
          </div>

          <Button
            onClick={() => startGame(books)}
            disabled={loading}
            className="w-full py-8 text-2xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 rounded-2xl shadow-xl transform hover:scale-105 transition-all"
          >
            {loading ? "Loading..." : "Play"}
          </Button>

          <div className="mt-4">
            <button
              onClick={() => setPhase("book-selection")}
              className="text-sm text-teal-600 hover:text-teal-700 underline underline-offset-2"
            >
              Choose your books
            </button>
          </div>

          <Button
            onClick={() => {
              const exitData = {
                year,
                division,
                exitedFrom: "intro",
              };
              track("zoomiesExit", exitData);
              posthog.capture("zoomiesExit", exitData);
              onExit();
            }}
            variant="ghost"
            className="mt-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Modes
          </Button>
        </div>
      </div>
    );
  }

  // Book selection screen
  if (phase === "book-selection") {
    const toggleBook = (bookKey: string) => {
      setBookSelectionSet((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(bookKey)) {
          newSet.delete(bookKey);
        } else {
          newSet.add(bookKey);
        }
        return newSet;
      });
    };

    const selectAllBooks = () => {
      setBookSelectionSet(new Set(books.map((b) => b.book_key)));
    };

    const clearAllBooks = () => {
      setBookSelectionSet(new Set());
    };

    const handleStartWithSelection = () => {
      const selected = books.filter((b) => bookSelectionSet.has(b.book_key));
      startGame(selected);
    };

    const canStart = bookSelectionSet.size >= 4;

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-cyan-50 flex flex-col p-4">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setPhase("intro")}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <button
              onClick={
                bookSelectionSet.size === books.length
                  ? clearAllBooks
                  : selectAllBooks
              }
              className="text-sm text-teal-600 hover:text-teal-700"
            >
              {bookSelectionSet.size === books.length
                ? "Clear all"
                : "Select all"}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-center mb-2 font-heading">
            Choose Your Books
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Select at least 4 books to play
          </p>

          {/* Book grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {books.map((book) => {
              const isSelected = bookSelectionSet.has(book.book_key);
              return (
                <button
                  key={book.book_key}
                  onClick={() => toggleBook(book.book_key)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden transition-all ${
                    isSelected
                      ? "ring-4 ring-teal-500 shadow-lg"
                      : "opacity-50 grayscale"
                  }`}
                >
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 25vw, 150px"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-teal-500 bg-opacity-20 flex items-center justify-center">
                      <PawPrint className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected count, multiplier, and start button */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {bookSelectionSet.size} of {books.length} books selected
              {bookSelectionSet.size < 4 && (
                <span className="text-red-500 ml-2">(need at least 4)</span>
              )}
            </p>
            {bookSelectionSet.size >= 4 && (
              <p
                className={`text-sm font-semibold mb-3 ${
                  bookSelectionSet.size === books.length
                    ? "text-teal-600"
                    : "text-orange-500"
                }`}
              >
                Score multiplier:{" "}
                {calculateBookMultiplier(
                  bookSelectionSet.size,
                  books.length
                ).toFixed(2)}
                x
              </p>
            )}
            <Button
              onClick={handleStartWithSelection}
              disabled={!canStart || loading}
              className="w-full max-w-xs py-6 text-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Loading..." : "Play"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (phase === "results") {
    const packRank = getPackRank();
    const correctCount = results.filter((r) => r.correct).length;

    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-cyan-50 flex flex-col items-center justify-center p-4">
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={300}
          />
        )}

        <div className="text-center max-w-md w-full">
          {/* Pack Rank Card */}
          <Card className="bg-white border-2 border-gray-400 p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] text-gray-900 mb-6">
            <div className="text-6xl mb-2">{packRank.emoji}</div>
            <h2 className={`text-3xl font-black ${packRank.color} mb-1`}>
              {packRank.rating}
            </h2>
            <p className="text-gray-500 text-sm mb-6">Your Pack Rank</p>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
              <div className="bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl p-2 sm:p-4">
                <div className="text-xl sm:text-3xl font-black text-teal-600 truncate">
                  {score.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Score
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-2 sm:p-4">
                <div className="text-xl sm:text-3xl font-black text-orange-600 flex items-center justify-center">
                  {maxStreak}
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6 ml-1" />
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Max Streak
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-2xl p-2 sm:p-4">
                <div className="text-xl sm:text-3xl font-black text-emerald-600">
                  {correctCount}/{results.length}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Correct
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                const correctCount = results.filter((r) => r.correct).length;
                const playAgainData = {
                  year,
                  division,
                  previousScore: score,
                  previousMaxStreak: maxStreak,
                  previousCorrectCount: correctCount,
                  previousTotalQuestions: results.length,
                };
                track("zoomiesPlayAgain", playAgainData);
                posthog.capture("zoomiesPlayAgain", playAgainData);
                setPhase("intro");
                setResults([]);
              }}
              className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-bold mb-3"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>

            <p className="text-sm text-gray-500 mt-3 mb-2">Want to challenge a friend?</p>
            <Button
              onClick={shareResults}
              variant="outline"
              className="w-full py-4 border-2 border-cyan-300 text-cyan-600 hover:bg-cyan-50 rounded-xl font-bold"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Your Score
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Playing screen
  const currentQuestion = questions[currentIndex];
  const timerPercentage = (timeLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="h-dvh bg-gradient-to-b from-white to-cyan-50 flex flex-col p-2 sm:p-4 overflow-auto">
      {/* Sticky header with progress and timer */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white to-transparent pb-6 -mx-2 px-2 sm:-mx-4 sm:px-4">
        {/* Header - Progress and Score */}
        <div className="flex justify-between items-center mb-2 text-base font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">
              {currentIndex + 1} / {questions.length}
            </span>
            {/* Streak indicator */}
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-full animate-pulse">
                <Flame className="w-4 h-4" />
                <span className="font-bold text-sm">{streak}</span>
              </div>
            )}
            {/* Combo multiplier */}
            {comboMultiplier > 1 && (
              <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-black text-sm animate-bounce">
                {comboMultiplier}x
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-teal-600">
            <Trophy className="w-5 h-5" />
            <span className="font-bold">{score.toLocaleString()}</span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-100 rounded-full ${
              timerPercentage > 50
                ? "bg-emerald-400"
                : timerPercentage > 25
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center">
        <Card
          className={`relative w-full max-w-sm bg-white border-2 border-gray-400 text-gray-900 rounded-3xl px-4 pt-4 pb-6 sm:px-6 sm:pt-6 sm:pb-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-200 ${
            reactionType === "correct"
              ? "animate-vibe-correct"
              : reactionType === "wrong"
              ? "animate-vibe-wrong"
              : ""
          }`}
        >
          {/* Reaction overlay */}
          {showReaction && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center z-20 px-4 ${
                reactionType === "correct" ? "bg-emerald-500" : "bg-red-500"
              }`}
            >
              {reactionType === "correct" ? (
                <Check className="w-16 h-16 text-white mb-2" strokeWidth={3} />
              ) : (
                <X className="w-16 h-16 text-white mb-2" strokeWidth={3} />
              )}
              <span
                className={`font-black text-white animate-vibe-reaction text-center leading-tight ${
                  showReaction.length > 20
                    ? "text-2xl"
                    : showReaction.length > 12
                    ? "text-3xl"
                    : "text-5xl"
                }`}
              >
                {showReaction}
              </span>
            </div>
          )}

          {/* Streak popup */}
          {showStreakPopup && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-full font-black text-xl animate-vibe-streak whitespace-nowrap shadow-xl">
                {showStreakPopup}
              </div>
            </div>
          )}

          <div className="text-center mb-4 sm:mb-6">
            <span className="text-sm uppercase tracking-widest text-teal-500 font-bold">
              In which book...
            </span>
            <p className="text-xl sm:text-2xl font-bold mt-2 leading-tight">
              {currentQuestion?.text}
            </p>
          </div>

          {/* Answer options - 2x2 grid of book covers */}
          <div className="grid grid-cols-2 gap-3 w-64 sm:w-72 mx-auto">
            {answerOptions.map((book) => (
              <button
                key={book.book_key}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleAnswer(book);
                }}
                className="relative aspect-[3/4] rounded-lg overflow-hidden border-3 border-transparent hover:border-cyan-400 focus:border-transparent focus:outline-none transition-all transform hover:scale-105 active:scale-95 shadow-md"
              >
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 200px"
                />
              </button>
            ))}
          </div>
        </Card>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="mt-4 flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors mx-auto"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
          <span className="text-sm">{soundEnabled ? "Sound on" : "Sound off"}</span>
        </button>
      </div>

      {/* Audio elements */}
      {Array.from({ length: CORRECT_SOUND_COUNT }, (_, i) => (
        <audio
          key={`correct${i + 1}`}
          ref={(el) => {
            if (el && !correctSounds.current.includes(el)) {
              correctSounds.current[i] = el;
            }
          }}
          src={`/sounds/correct${i + 1}.ogg`}
          preload="auto"
        />
      ))}
      {Array.from({ length: WRONG_SOUND_COUNT }, (_, i) => (
        <audio
          key={`wrong${i + 1}`}
          ref={(el) => {
            if (el && !wrongSounds.current.includes(el)) {
              wrongSounds.current[i] = el;
            }
          }}
          src={`/sounds/wrong${i + 1}.ogg`}
          preload="auto"
        />
      ))}
      {Array.from({ length: STREAK_SOUND_COUNT }, (_, i) => (
        <audio
          key={`streak${i + 1}`}
          ref={(el) => {
            if (el && !streakSounds.current.includes(el)) {
              streakSounds.current[i] = el;
            }
          }}
          src={`/sounds/streak${i + 1}.ogg`}
          preload="auto"
        />
      ))}
    </div>
  );
}
