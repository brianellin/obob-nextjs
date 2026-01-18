"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkipForward, Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { QuestionWithBook, Book } from "@/types";
import Link from "next/link";
import { WavyUnderline } from "./WavyUnderline";
import { useToast } from "@/hooks/use-toast";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { track } from "@vercel/analytics";
import { usePostHog } from "posthog-js/react";
import QuestionFeedback from "./QuestionFeedback";
import QuestionFeedbackForm from "./QuestionFeedbackForm";
import QuestionReload from "./QuestionReload";
import MockBattleResults from "./MockBattleResults";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type QuizPageProps = {
  selectedBooks: Book[];
  quizMode: "personal" | "friend" | "mock";
  onQuizEnd: () => void;
  questionCount: number;
  questionType: "in-which-book" | "content" | "both";
  year: string;
  division: string;
  stealsEnabled?: boolean; // For mock battles
};

const TIMER_DURATION = 15; // 15 seconds

type QuestionResult = {
  question: QuestionWithBook;
  pointsAwarded: number;
  team?: "A" | "B"; // For mock battles
  stolenBy?: "A" | "B"; // For mock battles when a team steals
};

// Helper function to lowercase the first character of a string
function lowercaseFirstChar(str: string): string {
  if (!str) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}

// Helper components for colored team labels
function TeamALabel({ children }: { children: React.ReactNode }) {
  return <span className="text-pink-500 font-semibold">{children}</span>;
}

function TeamBLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-lime-500 font-semibold">{children}</span>;
}

// Add this function outside the component
async function fetchQuestionsFromAPI(
  selectedBooks: Book[],
  questionCount: number,
  questionType: "in-which-book" | "content" | "both",
  year: string,
  division: string
) {
  const response = await fetch("/api/questions/battle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      selectedBooks,
      questionCount,
      questionType,
      year,
      division,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }

  return response.json();
}

export default function QuizPage({
  selectedBooks,
  quizMode,
  onQuizEnd,
  questionCount,
  questionType,
  year,
  division,
  stealsEnabled = true,
}: QuizPageProps) {
  const posthog = usePostHog();
  const [questions, setQuestions] = useState<QuestionWithBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [showPartialAnimation, setShowPartialAnimation] = useState(false);
  const [cardAnimationType, setCardAnimationType] = useState<
    "correct" | "partial" | "incorrect" | null
  >(null);
  const [successEmojis, setSuccessEmojis] = useState<string[]>([
    "✨",
    "✨",
    "✨",
    "✨",
  ]);
  const [partialEmojis, setPartialEmojis] = useState<string[]>([
    "👌",
    "👌",
    "👌",
  ]);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const boopSound = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const { toast } = useToast();
  const { width, height } = useWindowSize();
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [reloadingQuestion, setReloadingQuestion] = useState(false);

  // Mock battle state
  const [currentTeam, setCurrentTeam] = useState<"A" | "B">("A");
  const [waitingForSteal, setWaitingForSteal] = useState(false);
  const [originalTeam, setOriginalTeam] = useState<"A" | "B">("A");

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await fetchQuestionsFromAPI(
        selectedBooks,
        questionCount,
        questionType,
        year,
        division
      );
      if (data.message) {
        toast({
          title: "Note",
          description: data.message,
        });
      }
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast({
        title: "Error",
        description: "Failed to load questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBooks, questionCount, questionType, year, division]);

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setIsTimerRunning(false);
            // Show answer when timer runs out so moderator can see it and score
            setShowAnswer(true);
            boopSound.current?.play();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      setShowAnswer(true);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerRunning, timeLeft, quizMode]);

  useEffect(() => {
    if (quizFinished) {
      console.log("tracking battleFinished");
      const battleFinishedData: Record<string, string | number | boolean> = {
        quizMode,
        questionCount,
        questionType,
        year,
        division,
        numBooks: selectedBooks.length,
        score: calculateScore(),
        possibleScore: questions.length * 5,
      };

      // Add mock battle specific data
      if (quizMode === "mock") {
        const teamAScore = calculateTeamScore("A");
        const teamBScore = calculateTeamScore("B");
        const winner = teamAScore > teamBScore ? "A" : teamBScore > teamAScore ? "B" : "tie";

        battleFinishedData.stealsEnabled = stealsEnabled;
        battleFinishedData.teamAScore = teamAScore;
        battleFinishedData.teamBScore = teamBScore;
        battleFinishedData.winner = winner;
      }

      track("battleFinished", battleFinishedData);
      posthog.capture("battleFinished", battleFinishedData);
    } else {
      console.log("tracking battleStarted");
      const battleStartedData: Record<string, string | number | boolean> = {
        quizMode,
        questionCount,
        questionType,
        year,
        division,
        numBooks: selectedBooks.length,
      };

      // Add mock battle specific data
      if (quizMode === "mock") {
        battleStartedData.stealsEnabled = stealsEnabled;
      }

      track("battleStarted", battleStartedData);
      posthog.capture("battleStarted", battleStartedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizFinished]);

  // Track when a new question is shown
  useEffect(() => {
    if (questions.length > 0 && !quizFinished) {
      const currentQuestion = questions[currentQuestionIndex];
      const questionStartedData = {
        questionIndex: currentQuestionIndex,
        questionNumber: currentQuestionIndex + 1,
        questionType: currentQuestion.type,
        bookKey: currentQuestion.book.book_key,
        bookTitle: currentQuestion.book.title,
        bookAuthor: currentQuestion.book.author,
        page: currentQuestion.page ?? 0,
        quizMode,
        year,
        division,
      };
      console.log("tracking questionStarted", questionStartedData);
      track("questionStarted", questionStartedData);
      posthog.capture("questionStarted", questionStartedData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions, quizFinished]);

  const handleShowAnswer = () => {
    setShowAnswer(true);
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setTimeLeft(TIMER_DURATION);
    setShowAnswer(false);
  };

  const getRandomSuccessEmojis = () => {
    const emojiOptions = [
      "⭐",
      "🌟",
      "✨",
      "💫",
      "📚",
      "📖",
      "📕",
      "📗",
      "📘",
      "🤓",
      "🐶",
      "🐕",
      "🦴",
    ];
    const selected: string[] = [];
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * emojiOptions.length);
      selected.push(emojiOptions[randomIndex]);
    }
    return selected;
  };

  const getRandomPartialEmojis = () => {
    const emojiOptions = [
      "👍",
      "👏",
      "😊",
      "🙂",
      "💪",
      "📈",
      "⬆️",
      "🎯",
      "💛",
      "🌟",
      "☀️",
      "🔥",
      "👌",
    ];
    const selected: string[] = [];
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * emojiOptions.length);
      selected.push(emojiOptions[randomIndex]);
    }
    return selected;
  };

  const handleAnswer = (points: number) => {
    // Track the answer event
    const answerType =
      points === 5
        ? "correct"
        : points === 3
        ? "partially_correct"
        : "incorrect";
    const questionAnsweredData = {
      questionIndex: currentQuestionIndex,
      questionNumber: currentQuestionIndex + 1,
      questionType: currentQuestion.type,
      bookKey: currentQuestion.book.book_key,
      bookTitle: currentQuestion.book.title,
      bookAuthor: currentQuestion.book.author,
      page: currentQuestion.page ?? 0,
      pointsAwarded: points,
      answerType,
      quizMode,
      year,
      division,
    };
    console.log("tracking questionAnswered", questionAnsweredData);
    track("questionAnswered", questionAnsweredData);
    // PostHog capture removed to reduce event volume

    // Animate score for perfect answers
    if (points === 5) {
      setSuccessEmojis(getRandomSuccessEmojis());
      setShowSuccessAnimation(true);
      setCardAnimationType("correct");
      setTimeout(() => {
        setShowSuccessAnimation(false);
        setCardAnimationType(null);
      }, 800);
    } else if (points === 3) {
      // Partial correct - yellow glow with score animation and progress emojis
      setPartialEmojis(getRandomPartialEmojis());
      setShowPartialAnimation(true);
      setCardAnimationType("partial");
      setTimeout(() => {
        setShowPartialAnimation(false);
        setCardAnimationType(null);
      }, 800);
    } else if (points === 0) {
      // Incorrect - red glow
      setCardAnimationType("incorrect");
      setTimeout(() => {
        setCardAnimationType(null);
      }, 800);
    }

    // Mock battle logic: Handle steal opportunity
    if (quizMode === "mock") {
      if (points === 0 && !waitingForSteal && stealsEnabled) {
        // Incorrect answer - stop timer and offer steal opportunity to other team (only if steals enabled)
        const stealingTeam = currentTeam === "A" ? "B" : "A";

        // Track steal opportunity
        const stealOpportunityData = {
          questionIndex: currentQuestionIndex,
          questionNumber: currentQuestionIndex + 1,
          questionType: currentQuestion.type,
          bookKey: currentQuestion.book.book_key,
          originalTeam: currentTeam,
          stealingTeam,
          quizMode,
          year,
          division,
        };
        console.log("tracking stealOpportunity", stealOpportunityData);
        track("stealOpportunity", stealOpportunityData);
        posthog.capture("stealOpportunity", stealOpportunityData);

        setIsTimerRunning(false);
        setTimeLeft(TIMER_DURATION);
        setWaitingForSteal(true);
        setCurrentTeam(stealingTeam);
        return; // Don't advance yet
      }

      // Track steal attempt if this was a steal opportunity
      if (waitingForSteal) {
        const stealSuccess = points > 0;
        const stealAttemptData = {
          questionIndex: currentQuestionIndex,
          questionNumber: currentQuestionIndex + 1,
          questionType: currentQuestion.type,
          bookKey: currentQuestion.book.book_key,
          originalTeam,
          stealingTeam: currentTeam,
          stealSuccess,
          pointsAwarded: points,
          quizMode,
          year,
          division,
        };
        console.log("tracking stealAttempt", stealAttemptData);
        track("stealAttempt", stealAttemptData);
        posthog.capture("stealAttempt", stealAttemptData);
      }

      // Record the result with team information
      setQuestionResults((prev) => {
        const newResults = [...prev];
        newResults[currentQuestionIndex] = {
          question: currentQuestion,
          pointsAwarded: points,
          team: originalTeam, // Always the original team that was assigned the question
          stolenBy: waitingForSteal ? currentTeam : undefined,
        };
        return newResults;
      });

      // Reset steal state and move to next question
      setWaitingForSteal(false);

      // Alternate teams for next question
      const nextTeam = originalTeam === "A" ? "B" : "A";
      setOriginalTeam(nextTeam);
      setCurrentTeam(nextTeam);
    } else {
      // Regular solo/friend battle logic
      setQuestionResults((prev) => {
        const newResults = [...prev];
        newResults[currentQuestionIndex] = {
          question: currentQuestion,
          pointsAwarded: points,
        };
        return newResults;
      });
    }

    nextQuestion();
  };

  const nextQuestion = () => {
    // Record the skip if there's no existing result
    setQuestionResults((prev) => {
      const newResults = [...prev];
      if (!newResults[currentQuestionIndex]) {
        newResults[currentQuestionIndex] = {
          question: currentQuestion,
          pointsAwarded: -1, // Using -1 to indicate a skip
          team: quizMode === "mock" ? originalTeam : undefined,
        };
      }
      return newResults;
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
      setIsTimerRunning(false);
      setTimeLeft(TIMER_DURATION);
      setShowFeedbackForm(false); // Close feedback form on question change

      // Reset mock battle steal state if in mock mode
      if (quizMode === "mock") {
        setWaitingForSteal(false);
        // If we were waiting for a steal and advancing, switch to the original team's next turn
        if (waitingForSteal) {
          const nextTeam = originalTeam === "A" ? "B" : "A";
          setOriginalTeam(nextTeam);
          setCurrentTeam(nextTeam);
        }
      }
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = async () => {
    await loadQuestions(); // Fetch new questions
    setCurrentQuestionIndex(0);
    setShowAnswer(false);
    setQuizFinished(false);
    setIsTimerRunning(false);
    setTimeLeft(TIMER_DURATION);
    setQuestionResults([]);
    setShowFeedbackForm(false); // Close feedback form on restart

    // Reset mock battle state
    if (quizMode === "mock") {
      setCurrentTeam("A");
      setOriginalTeam("A");
      setWaitingForSteal(false);
    }
  };

  const handleSkip = () => {
    // Track skip event
    const questionSkippedData = {
      questionIndex: currentQuestionIndex,
      questionNumber: currentQuestionIndex + 1,
      questionType: currentQuestion.type,
      bookKey: currentQuestion.book.book_key,
      bookTitle: currentQuestion.book.title,
      bookAuthor: currentQuestion.book.author,
      page: currentQuestion.page ?? 0,
      quizMode,
      year,
      division,
    };
    console.log("tracking questionSkipped", questionSkippedData);
    track("questionSkipped", questionSkippedData);
    posthog.capture("questionSkipped", questionSkippedData);

    nextQuestion();
  };

  const previousQuestion = () => {
    // Track back button click
    const questionBackData = {
      fromQuestionIndex: currentQuestionIndex,
      fromQuestionNumber: currentQuestionIndex + 1,
      toQuestionIndex:
        currentQuestionIndex > 0 ? currentQuestionIndex - 1 : null,
      toQuestionNumber: currentQuestionIndex > 0 ? currentQuestionIndex : null,
      quizMode,
      year,
      division,
    };
    console.log("tracking questionBack", questionBackData);
    track("questionBack", questionBackData);
    posthog.capture("questionBack", questionBackData);

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowAnswer(false);
      setIsTimerRunning(false);
      setTimeLeft(TIMER_DURATION);
      setShowFeedbackForm(false); // Close feedback form on question change
    } else {
      onQuizEnd();
    }
  };

  const handleReloadQuestion = async () => {
    try {
      setReloadingQuestion(true);

      // Track reload event
      const questionReloadData = {
        questionIndex: currentQuestionIndex,
        questionNumber: currentQuestionIndex + 1,
        questionType: currentQuestion.type,
        bookKey: currentQuestion.book.book_key,
        bookTitle: currentQuestion.book.title,
        bookAuthor: currentQuestion.book.author,
        page: currentQuestion.page ?? 0,
        quizMode,
        year,
        division,
      };
      console.log("tracking questionReload", questionReloadData);
      track("questionReload", questionReloadData);
      posthog.capture("questionReload", questionReloadData);

      const response = await fetch("/api/questions/reload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year,
          division,
          questionType: currentQuestion.type, // Use the current question's type, not the overall quiz type
          selectedBooks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reload question");
      }

      const data = await response.json();

      // Replace the current question in the questions array
      setQuestions((prevQuestions) => {
        const newQuestions = [...prevQuestions];
        newQuestions[currentQuestionIndex] = data.question;
        return newQuestions;
      });

      // Reset question state
      setShowAnswer(false);
      setIsTimerRunning(false);
      setTimeLeft(TIMER_DURATION);
      setShowFeedbackForm(false);

      // Reset mock battle state if applicable
      if (quizMode === "mock") {
        setWaitingForSteal(false);
      }

      toast({
        title: "Question reloaded",
        description: "A new question has been loaded.",
      });
    } catch (error) {
      console.error("Error reloading question:", error);
      toast({
        title: "Error",
        description: "Failed to reload question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReloadingQuestion(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-600" />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  const calculateScore = () => {
    return questionResults.reduce((total, result) => {
      return total + (result.pointsAwarded >= 0 ? result.pointsAwarded : 0);
    }, 0);
  };

  const calculateTeamScore = (team: "A" | "B") => {
    return questionResults.reduce((total, result) => {
      if (result.pointsAwarded >= 0) {
        // If question was stolen by this team, they get the points
        if (result.stolenBy === team) {
          return total + result.pointsAwarded;
        }
        // If question was originally for this team and not stolen, they get the points
        if (result.team === team && !result.stolenBy) {
          return total + result.pointsAwarded;
        }
      }
      return total;
    }, 0);
  };

  if (quizFinished) {
    // Use special results screen for mock battles
    if (quizMode === "mock") {
      return (
        <MockBattleResults
          questionResults={questionResults}
          questions={questions}
          teamAScore={calculateTeamScore("A")}
          teamBScore={calculateTeamScore("B")}
          onRestart={restartQuiz}
          onEnd={onQuizEnd}
        />
      );
    }

    return (
      <div className="container p-4 mt-8">
        {calculateScore() === questions.length * 5 && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
          />
        )}
        <Card className="w-full max-w-xl mx-auto drop-shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Battle complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-xl mb-4">
                Your score: {calculateScore()} out of {questions.length * 5}
              </p>
              <p className="text-lg mb-6">
                {calculateScore() === questions.length * 5
                  ? "Perfect score! You're an OBOB champion!"
                  : calculateScore() >= questions.length * 4
                  ? "Great job! You're almost there!"
                  : calculateScore() >= questions.length * 3
                  ? "Good effort! Keep practicing!"
                  : "Nice try! There's room for improvement. Keep reading!"}
              </p>
            </div>

            <div className="justify-center flex gap-4 flex-col mb-8">
              <Button
                onClick={restartQuiz}
                className="bg-purple-500 hover:bg-purple-600 w-full"
              >
                Battle again with same books
              </Button>
              <Button onClick={onQuizEnd} variant="outline" className="w-full">
                Start over
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Battle review:</h3>
              {questionResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">Question {index + 1}:</p>
                      <p className="text-sm text-gray-600">
                        {result.question.type === "in-which-book"
                          ? `In which book ${lowercaseFirstChar(
                              result.question.text
                            )}`
                          : `In ${result.question.book.title}: ${result.question.text}`}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        result.pointsAwarded === 5
                          ? "bg-emerald-100 text-emerald-700"
                          : result.pointsAwarded === 3
                          ? "bg-amber-100 text-amber-700"
                          : result.pointsAwarded === -1
                          ? "bg-gray-100 text-gray-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {result.pointsAwarded === -1
                        ? "Skipped"
                        : `${result.pointsAwarded} pts`}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    Answer:{" "}
                    {result.question.type === "in-which-book"
                      ? `${result.question.book.title} by ${result.question.book.author}`
                      : result.question.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      {/* New header section above the card */}
      <div className="w-full max-w-xl mx-auto relative z-50 overflow-visible">
        <div className="flex flex-col  items-center justify-between overflow-visible">
          <h1 className="text-2xl font-bold mb-7 font-heading">
            {quizMode === "personal" ? (
              <WavyUnderline style={0} thickness={4} color="text-purple-500">
                Solo battle
              </WavyUnderline>
            ) : quizMode === "friend" ? (
              <WavyUnderline style={0} thickness={5} color="text-violet-700">
                Friend battle
              </WavyUnderline>
            ) : (
              <WavyUnderline style={0} thickness={5} color="text-orange-500">
                Mock battle
              </WavyUnderline>
            )}
          </h1>

          <div className="w-full flex items-center justify-between gap-4 mb-2 px-1 relative z-50">
            <span className="text-lg font-semibold">
              Question: {currentQuestionIndex + 1}/{questions.length}
            </span>
            <span className="text-lg font-semibold">
              {quizMode === "mock" ? (
                <span>
                  <TeamALabel>Odds</TeamALabel>: {calculateTeamScore("A")} |{" "}
                  <TeamBLabel>Evens</TeamBLabel>: {calculateTeamScore("B")}
                </span>
              ) : (
                <>
                  Score:
                  <span
                    className={`ml-2 inline-block relative z-50 ${
                      showSuccessAnimation
                        ? "animate-score-pop"
                        : showPartialAnimation
                        ? "animate-score-pop-partial"
                        : ""
                    }`}
                  >
                    {calculateScore()}/{questions.length * 5}
                    {/* Sparkle particles for perfect answer */}
                    {showSuccessAnimation && (
                      <>
                        <span className="absolute -top-2 -left-2 text-yellow-400 animate-sparkle-1 z-[9999]">
                          {successEmojis[0]}
                        </span>
                        <span className="absolute -top-2 -right-2 text-yellow-400 animate-sparkle-2 z-[9999]">
                          {successEmojis[1]}
                        </span>
                        <span className="absolute -bottom-2 -left-2 text-yellow-400 animate-sparkle-3 z-[9999]">
                          {successEmojis[2]}
                        </span>
                        <span className="absolute -top-2 -right-2 text-yellow-400 animate-sparkle-4 z-[9999]">
                          {successEmojis[3]}
                        </span>
                      </>
                    )}
                    {/* Progress emoji particles for partial correct */}
                    {showPartialAnimation && (
                      <>
                        <span className="absolute -top-2 -left-2 text-amber-500 animate-sparkle-1 z-[9999]">
                          {partialEmojis[0]}
                        </span>
                        <span className="absolute -top-2 -right-2 text-amber-500 animate-sparkle-2 z-[9999]">
                          {partialEmojis[1]}
                        </span>
                        <span className="absolute -bottom-2 -right-2 text-amber-500 animate-sparkle-4 z-[9999]">
                          {partialEmojis[2]}
                        </span>
                      </>
                    )}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <Card
        className={`w-full max-w-xl mx-auto drop-shadow-md relative transition-all duration-300 ${
          cardAnimationType === "correct"
            ? "animate-card-success"
            : cardAnimationType === "partial"
            ? "animate-card-partial"
            : cardAnimationType === "incorrect"
            ? "animate-card-incorrect"
            : ""
        }`}
      >
        <CardContent className="p-5 mb-0">
          <div className="">
            <div>
              <p className="text-xl mb-4">
                {currentQuestion.type === "in-which-book" ? (
                  <span>
                    {quizMode === "mock" && (
                      <>
                        <span
                          className={
                            currentTeam === "A"
                              ? "text-pink-500 font-bold"
                              : "text-lime-500 font-bold"
                          }
                        >
                          {currentTeam === "A" ? "Odds" : "Evens"}
                        </span>
                        {waitingForSteal && (
                          <span className="text-black">
                            {" "}
                            (<span className="text-red-500">steal</span>)
                          </span>
                        )}
                        <span className="text-black">: </span>
                      </>
                    )}
                    <span className="font-bold">In which book </span>
                    {lowercaseFirstChar(currentQuestion.text)}
                  </span>
                ) : (
                  <span>
                    {quizMode === "mock" && (
                      <>
                        <span
                          className={
                            currentTeam === "A"
                              ? "text-pink-500 font-bold"
                              : "text-lime-500 font-bold"
                          }
                        >
                          {currentTeam === "A" ? "Odds" : "Evens"}
                        </span>
                        {waitingForSteal && (
                          <span className="text-black">
                            {" "}
                            (<span className="text-red-500">steal</span>)
                          </span>
                        )}
                        <span className="text-black">: </span>
                      </>
                    )}
                    In{" "}
                    <span className="font-bold">
                      {currentQuestion.book.title}
                    </span>{" "}
                    by{" "}
                    {currentQuestion.book.author_pronunciation ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <span
                            className="font-bold underline decoration-dotted decoration-gray-400 underline-offset-2 hover:decoration-gray-600 transition-all cursor-pointer"
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              const eventData = {
                                author: currentQuestion.book.author,
                                bookKey: currentQuestion.book.book_key,
                                bookTitle: currentQuestion.book.title,
                                year,
                                division,
                                quizMode,
                              };
                              track("authorPronunciationView", eventData);
                              posthog.capture("authorPronunciationView", eventData);
                            }}
                          >
                            {currentQuestion.book.author}
                          </span>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-3 text-sm font-medium"
                          side="top"
                          align="center"
                        >
                          <div className="flex items-center gap-2">
                            <span>{currentQuestion.book.author_pronunciation}</span>
                            {currentQuestion.book.pronunciation_source && (
                              <a
                                href={currentQuestion.book.pronunciation_source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const eventData = {
                                    author: currentQuestion.book.author,
                                    bookKey: currentQuestion.book.book_key,
                                    bookTitle: currentQuestion.book.title,
                                    year,
                                    division,
                                    quizMode,
                                  };
                                  track("authorPronunciationListen", eventData);
                                  posthog.capture("authorPronunciationListen", eventData);
                                }}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                </svg>
                                <span className="text-xs">Listen</span>
                              </a>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="font-bold">
                        {currentQuestion.book.author}
                      </span>
                    )}{" "}
                    <span className="pt-4 block">
                      {currentQuestion.text.charAt(0).toUpperCase() +
                        currentQuestion.text.slice(1)}
                    </span>
                  </span>
                )}
              </p>
            </div>
            {(quizMode === "friend" || quizMode === "mock") && (
              <div className="space-y-2">
                {!isTimerRunning && !showAnswer && (
                  <Button
                    onClick={handleStartTimer}
                    className="w-full bg-cyan-400 hover:bg-cyan-500"
                  >
                    Start Timer
                  </Button>
                )}
                {(isTimerRunning || showAnswer) && (
                  <>
                    <Progress
                      value={
                        ((TIMER_DURATION - timeLeft) / TIMER_DURATION) * 100
                      }
                      className="w-full h-3"
                    />
                    <p className="text-center font-semibold">
                      {timeLeft > 0 ? `Time left: ${timeLeft}s` : "Time's up!"}
                    </p>
                  </>
                )}
              </div>
            )}
            {((quizMode === "personal" && showAnswer) ||
              ((quizMode === "friend" || quizMode === "mock") &&
                (showAnswer || isTimerRunning))) && (
              <div className="bg-slate-100 p-3 rounded-md my-4">
                <p className="text-lg font-medium">
                  {currentQuestion.type === "in-which-book" ? (
                    <span>
                      <span className="font-semibold">
                        {currentQuestion.book.title}
                      </span>{" "}
                      by{" "}
                      {currentQuestion.book.author_pronunciation ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <span
                              className="font-semibold underline decoration-dotted decoration-gray-400 underline-offset-2 hover:decoration-gray-600 transition-all cursor-pointer"
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                const eventData = {
                                  author: currentQuestion.book.author,
                                  bookKey: currentQuestion.book.book_key,
                                  bookTitle: currentQuestion.book.title,
                                  year,
                                  division,
                                  quizMode,
                                };
                                track("authorPronunciationView", eventData);
                                posthog.capture("authorPronunciationView", eventData);
                              }}
                            >
                              {currentQuestion.book.author}
                            </span>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-3 text-sm font-medium"
                            side="top"
                            align="center"
                          >
                            <div className="flex items-center gap-2">
                              <span>{currentQuestion.book.author_pronunciation}</span>
                              {currentQuestion.book.pronunciation_source && (
                                <a
                                  href={currentQuestion.book.pronunciation_source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const eventData = {
                                      author: currentQuestion.book.author,
                                      bookKey: currentQuestion.book.book_key,
                                      bookTitle: currentQuestion.book.title,
                                      year,
                                      division,
                                      quizMode,
                                    };
                                    track("authorPronunciationListen", eventData);
                                    posthog.capture("authorPronunciationListen", eventData);
                                  }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-4 h-4"
                                  >
                                    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                    <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                  </svg>
                                  <span className="text-xs">Listen</span>
                                </a>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="font-semibold">
                          {currentQuestion.book.author}
                        </span>
                      )}
                    </span>
                  ) : (
                    currentQuestion.answer.charAt(0).toUpperCase() +
                    currentQuestion.answer.slice(1)
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Page: {currentQuestion.page}
                </p>
              </div>
            )}
          </div>

          {quizMode === "personal" && !showAnswer ? (
            <Button
              onClick={handleShowAnswer}
              className="w-full bg-cyan-400 hover:bg-cyan-500"
            >
              Show Answer
            </Button>
          ) : (
            (quizMode === "personal" ||
              ((quizMode === "friend" || quizMode === "mock") &&
                (isTimerRunning || showAnswer))) && (
              <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4 w-full">
                <Button
                  onClick={() => handleAnswer(5)}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Correct (5 pts)
                </Button>
                <Button
                  onClick={() => handleAnswer(3)}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Partially Correct (3 pts)
                </Button>
                <Button
                  onClick={() => handleAnswer(0)}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Incorrect (0 pts)
                </Button>
              </div>
            )
          )}
          <div>
            <div className="flex items-center justify-between mt-4">
              {/* Invisible spacer to balance the icons on the right */}
              <div className="w-6"></div>

              {/* Centered source text */}
              <div className="flex items-center justify-center text-xs gap-1 text-muted-foreground">
                Source:{" "}
                {currentQuestion.source!.link ? (
                  <Link
                    href={currentQuestion.source!.link}
                    className=" flex items-center gap-1 hover:text-muted-foreground/80"
                    target="_blank"
                  >
                    {currentQuestion.source?.name}
                    {currentQuestion.contributor &&
                      ` - ${currentQuestion.contributor}`}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <span>
                    {currentQuestion.source?.name}
                    {currentQuestion.contributor &&
                      ` - ${currentQuestion.contributor}`}
                  </span>
                )}
              </div>

              {/* Reload and Flag buttons on the right */}
              <div className="flex items-center gap-1">
                {quizMode === "mock" && (
                  <QuestionReload
                    onClick={handleReloadQuestion}
                    disabled={reloadingQuestion}
                  />
                )}
                <QuestionFeedback
                  onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                />
              </div>
            </div>

            {/* Feedback Form below source section */}
            {showFeedbackForm && (
              <QuestionFeedbackForm
                question={currentQuestion}
                year={year}
                division={division}
                onClose={() => setShowFeedbackForm(false)}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skip and back buttons (not shown in mock battles) */}
      {quizMode !== "mock" && (
        <div className="w-full max-w-xl mx-auto mt-4 flex gap-2">
          <Button
            onClick={previousQuestion}
            variant="outline"
            className="w-full flex items-center justify-center touch-none"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            <span>Back</span>
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            className="w-full flex items-center justify-center touch-none"
          >
            <span>Skip</span>
            <SkipForward className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
