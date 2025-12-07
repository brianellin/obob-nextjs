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

type GamePhase = "intro" | "playing" | "results";

type ZoomiesResult = {
  question: QuestionWithBook;
  correct: boolean;
  timeMs: number;
  streakAtTime: number;
};

// Fun reaction messages - mix of modern slang and retro throwbacks
const CORRECT_REACTIONS = [
  // Modern
  "SLAY",
  "NO CAP",
  "GOATED",
  "VALID",
  "BUSSIN",
  "W",
  "FIRE",
  "ELITE",
  "LEGENDARY",
  "SHEESH",
  "PERIOD",
  "MAIN CHARACTER",
  "ICONIC",
  "BIG BRAIN",
  "GALAXY BRAIN",
  "CERTIFIED",
  "IMMACULATE",
  "YAAAS",
  "HITS DIFFERENT",
  "BASED",
  "FACTS",
  "UNDERSTOOD THE ASSIGNMENT",
  "SERVED",
  "CHEF'S KISS",
  "SLAYED",
  "IT'S GIVING SMART",
  "RENT FREE",
  "REAL",
  "LOWKEY GENIUS",
  // 2000s
  "EPIC WIN",
  "YOU ROCK",
  "TOTALLY AWESOME",
  "SICK",
  "SWEET",
  "BEAST MODE",
  "OWNED IT",
  "FTW",
  "LEGIT",
  // 90s
  "ALL THAT",
  "DA BOMB",
  "PHAT",
  "WORD",
  "TIGHT",
  "FLY",
  "STELLAR",
  // 80s
  "RADICAL",
  "TOTALLY TUBULAR",
  "GNARLY",
  "BODACIOUS",
  "RIGHTEOUS",
  "CHOICE",
  "FRESH",
  "TO THE MAX",
  "COWABUNGA",
];

const WRONG_REACTIONS = [
  // Encouraging modern
  "ALMOST",
  "SO CLOSE",
  "NEXT TIME",
  "KEEP GOING",
  "YOU GOT THIS",
  "TRY AGAIN",
  "OOPS",
  "NOT QUITE",
  "CLOSE ONE",
  "GOOD TRY",
  // Playful modern
  "BRUH",
  "OOF",
  "PLOT TWIST",
  "WHOOPS",
  "BONK",
  "YOINK",
  "NOPE",
  "HMMMM",
  "WAIT WHAT",
  "HOLD UP",
  "COOKED",
  // Edgy modern (added back)
  "NAH",
  "RIP",
  "YIKES",
  "CAP",
  "SUS",
  "NOT IT",
  "CRINGE",
  "FLOPPED",
  "RATIO",
  "SKILL ISSUE",
  "COPE",
  "SIKE",
  "THAT AIN'T IT",
  "TRY AGAIN BESTIE",
  "NOT THE VIBE",
  "READ MORE BOOKS",
  "VILLAIN ARC",
  "FLOP",
  "TRAGIC",
  // 2000s
  "MY BAD",
  "WOMP WOMP",
  "D'OH",
  "BOGUS",
  // 90s
  "AS IF",
  "PSYCH",
  "WHATEVER",
  "TALK TO THE HAND",
  "BOO YA... NOT",
  "NOT",
  "WHIFF",
  // 80s
  "BUMMER",
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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [comboMultiplier, setComboMultiplier] = useState(1);

  // Timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleAnswerRef = useRef<(selectedBook: Book | null) => void>(() => {});

  // Audio refs (sounds are optional - will fail silently if not available)
  const correctSound = useRef<HTMLAudioElement | null>(null);
  const wrongSound = useRef<HTMLAudioElement | null>(null);
  const streakSound = useRef<HTMLAudioElement | null>(null);

  // Play sound helper that fails silently
  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Sound not available - fail silently
      });
    }
  };

  const QUESTION_COUNT = 15;
  const TIME_PER_QUESTION = 15000; // 15 seconds

  // Fetch questions when game starts
  const startGame = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/questions/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedBooks: books,
          questionCount: QUESTION_COUNT,
          questionType: "in-which-book",
          year,
          division,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch questions");

      const data = await response.json();
      setQuestions(data.questions);
      setPhase("playing");
      setCurrentIndex(0);
      setStreak(0);
      setMaxStreak(0);
      setScore(0);
      setResults([]);
      setQuestionStartTime(Date.now());
      setTimeLeft(TIME_PER_QUESTION);
      setComboMultiplier(1);

      // Track game start
      track("zoomiesStarted", {
        year,
        division,
        questionCount: QUESTION_COUNT,
      });
      posthog.capture("zoomiesStarted", {
        year,
        division,
        questionCount: QUESTION_COUNT,
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

  // Get random wrong books for answer options
  const getAnswerOptions = useCallback(() => {
    if (!questions[currentIndex]) return [];

    const correctBook = questions[currentIndex].book;
    const wrongBooks = books
      .filter((b) => b.book_key !== correctBook.book_key)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [...wrongBooks, correctBook].sort(
      () => Math.random() - 0.5
    );
    return allOptions;
  }, [books, questions, currentIndex]);

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

    // Calculate score with combo
    let pointsEarned = 0;
    if (isCorrect) {
      // Base points + speed bonus + streak bonus
      const speedBonus = Math.max(
        0,
        Math.floor((TIME_PER_QUESTION - responseTime) / 100)
      );
      pointsEarned = (100 + speedBonus) * comboMultiplier;

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
        playSound(streakSound);
      }

      // Play sound
      playSound(correctSound);

      // Show reaction
      setReactionType("correct");
      setShowReaction(
        CORRECT_REACTIONS[Math.floor(Math.random() * CORRECT_REACTIONS.length)]
      );
    } else {
      setStreak(0);
      setComboMultiplier(1);

      playSound(wrongSound);

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
    if (percentage >= 75)
      return { rating: "GOOD DOGGG", emoji: "🦴", color: "text-purple-400" };
    if (percentage >= 60)
      return {
        rating: "LEARNING NEW TRICKS",
        emoji: "🐾",
        color: "text-cyan-400",
      };
    if (percentage >= 40)
      return { rating: "STILL A PUPPY", emoji: "🐶", color: "text-gray-400" };
    return { rating: "NEEDS MORE TREATS", emoji: "🦮", color: "text-red-400" };
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

Can you catch me? https://obob.dog/zoomies/${year}/${division}`;

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
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 flex flex-col items-center justify-center p-4 text-white">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-4 animate-bounce">🐕</div>
          <h1 className="text-5xl font-black mb-2 tracking-tight">ZOOMIES</h1>
          <p className="text-xl opacity-90 mb-8">
            How well do you know your OBOB books?
          </p>

          <div className="space-y-4 text-left bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
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
            onClick={startGame}
            disabled={loading}
            className="w-full py-8 text-2xl font-bold bg-white text-fuchsia-600 hover:bg-white/90 rounded-2xl shadow-2xl transform hover:scale-105 transition-all"
          >
            {loading ? "Loading..." : "START ZOOMIES"}
          </Button>

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
            className="mt-4 text-white/80 hover:text-white hover:bg-white/10"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Modes
          </Button>
        </div>

        {/* Audio elements */}
        <audio ref={correctSound} src="/sounds/correct.mp3" preload="auto" />
        <audio ref={wrongSound} src="/sounds/wrong.mp3" preload="auto" />
        <audio ref={streakSound} src="/sounds/streak.mp3" preload="auto" />
      </div>
    );
  }

  // Results screen
  if (phase === "results") {
    const packRank = getPackRank();
    const correctCount = results.filter((r) => r.correct).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 flex flex-col items-center justify-center p-4 text-white">
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
          <Card className="bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-2xl text-gray-900 mb-6">
            <div className="text-6xl mb-2">{packRank.emoji}</div>
            <h2 className={`text-3xl font-black ${packRank.color} mb-1`}>
              {packRank.rating}
            </h2>
            <p className="text-gray-500 text-sm mb-6">Your Pack Rank</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-violet-100 to-fuchsia-100 rounded-2xl p-4">
                <div className="text-3xl font-black text-fuchsia-600">
                  {score.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Score
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-4">
                <div className="text-3xl font-black text-orange-600 flex items-center justify-center">
                  {maxStreak}
                  <Flame className="w-6 h-6 ml-1" />
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Max Streak
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-100 to-cyan-100 rounded-2xl p-4">
                <div className="text-3xl font-black text-emerald-600">
                  {correctCount}/{results.length}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  Correct
                </div>
              </div>
            </div>

            <Button
              onClick={shareResults}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold mb-3"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Your Score
            </Button>
          </Card>

          <div className="flex gap-3">
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
              className="flex-1 py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold backdrop-blur-sm"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              Play Again
            </Button>
            <Button
              onClick={() => {
                const correctCount = results.filter((r) => r.correct).length;
                const exitData = {
                  year,
                  division,
                  finalScore: score,
                  maxStreak,
                  correctCount,
                  totalQuestions: results.length,
                  exitedFrom: "results",
                };
                track("zoomiesExit", exitData);
                posthog.capture("zoomiesExit", exitData);
                onExit();
              }}
              variant="ghost"
              className="py-4 text-white/80 hover:text-white hover:bg-white/10 rounded-xl"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Playing screen
  const currentQuestion = questions[currentIndex];
  const timerPercentage = (timeLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 flex flex-col p-4 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={() => {
            const correctCount = results.filter((r) => r.correct).length;
            const exitData = {
              year,
              division,
              currentScore: score,
              currentStreak: streak,
              maxStreak,
              correctCount,
              questionsAnswered: results.length,
              totalQuestions: QUESTION_COUNT,
              exitedFrom: "playing",
            };
            track("zoomiesExit", exitData);
            posthog.capture("zoomiesExit", exitData);
            onExit();
          }}
          variant="ghost"
          size="sm"
          className="text-white/80 hover:text-white hover:bg-white/10 p-2"
        >
          <X className="w-6 h-6" />
        </Button>

        <div className="flex items-center gap-4">
          {/* Streak indicator */}
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/80 px-3 py-1 rounded-full animate-pulse">
              <Flame className="w-4 h-4" />
              <span className="font-bold">{streak}</span>
            </div>
          )}

          {/* Combo multiplier */}
          {comboMultiplier > 1 && (
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-black text-sm animate-bounce">
              {comboMultiplier}x
            </div>
          )}

          {/* Sound toggle */}
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="ghost"
            size="sm"
            className="text-white/80 hover:text-white hover:bg-white/10 p-2"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full h-2 bg-white/20 rounded-full mb-4 overflow-hidden">
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

      {/* Progress */}
      <div className="flex justify-between items-center mb-4 text-sm">
        <span className="opacity-80">
          {currentIndex + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          <span className="font-bold">{score.toLocaleString()}</span>
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Card
          className={`relative w-full max-w-sm bg-white text-gray-900 rounded-3xl p-6 shadow-2xl overflow-hidden transition-all duration-200 ${
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

          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest text-fuchsia-500 font-bold">
              In which book...
            </span>
            <p className="text-xl font-bold mt-2 leading-tight">
              {currentQuestion?.text}
            </p>
          </div>

          {/* Answer options - 2x2 grid of book covers */}
          <div className="grid grid-cols-2 gap-3">
            {answerOptions.map((book) => (
              <button
                key={book.book_key}
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleAnswer(book);
                }}
                className="relative aspect-[3/4] rounded-xl overflow-hidden border-4 border-transparent hover:border-fuchsia-400 focus:border-transparent focus:outline-none transition-all transform hover:scale-105 active:scale-95 shadow-lg"
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
      </div>

      {/* Audio elements */}
      <audio ref={correctSound} src="/sounds/correct.mp3" preload="auto" />
      <audio ref={wrongSound} src="/sounds/wrong.mp3" preload="auto" />
      <audio ref={streakSound} src="/sounds/streak.mp3" preload="auto" />
    </div>
  );
}
