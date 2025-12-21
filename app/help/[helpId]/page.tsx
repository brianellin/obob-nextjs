"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, HelpCircle, Loader2, Check, AlertCircle } from "lucide-react";

interface HelpRequestData {
  helpId: string;
  clueNumber: number;
  clueDirection: "across" | "down";
  clueText: string;
  bookTitle: string;
  page?: number;
  answeredAt: number | null;
}

function HelpContent() {
  const params = useParams();
  const helpId = params.helpId as string;

  const [loading, setLoading] = useState(true);
  const [helpRequest, setHelpRequest] = useState<HelpRequestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    isCorrect: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchHelpRequest = async () => {
      try {
        const response = await fetch(`/api/daily-crossword/help/${helpId}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.expired) {
            setError("This help link has expired or doesn't exist.");
          } else {
            setError(data.error || "Failed to load help request");
          }
          return;
        }

        setHelpRequest(data.helpRequest);

        if (data.helpRequest.answeredAt) {
          setSubmitted(true);
        }
      } catch (err) {
        setError("Failed to load help request");
      } finally {
        setLoading(false);
      }
    };

    fetchHelpRequest();
  }, [helpId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/daily-crossword/help/${helpId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyAnswered) {
          setSubmitted(true);
          setSubmitResult({
            success: false,
            isCorrect: false,
            message: "This clue has already been answered by someone else.",
          });
        } else {
          setError(data.error || "Failed to submit answer");
        }
        return;
      }

      setSubmitted(true);
      setSubmitResult({
        success: true,
        isCorrect: data.isCorrect,
        message: data.message,
      });
    } catch (err) {
      setError("Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-lg">{error}</p>
            <Button variant="outline" onClick={() => window.close()}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!helpRequest) {
    return null;
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            {submitResult?.isCorrect ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-green-800">Correct!</h2>
                <p className="text-muted-foreground">{submitResult.message}</p>
              </>
            ) : submitResult ? (
              <>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-yellow-800">Answer Submitted</h2>
                <p className="text-muted-foreground">{submitResult.message}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold">Already Answered</h2>
                <p className="text-muted-foreground">
                  Someone already submitted an answer for this clue.
                </p>
              </>
            )}
            <Button variant="outline" onClick={() => window.close()}>
              Close this tab
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help Requested!
          </CardTitle>
          <CardDescription>
            Your teammate needs help with this crossword clue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Clue */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              {helpRequest.clueNumber} {helpRequest.clueDirection.toUpperCase()}
            </p>
            <p className="text-lg">{helpRequest.clueText}</p>
          </div>

          {/* Book reference */}
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-blue-50 border-blue-100">
            <BookOpen className="h-6 w-6 text-blue-600 shrink-0" />
            <div>
              <p className="font-medium text-blue-900">{helpRequest.bookTitle}</p>
              {helpRequest.page && (
                <p className="text-sm text-blue-700">Check page {helpRequest.page}</p>
              )}
            </div>
          </div>

          {/* Answer form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                What's the answer?
              </label>
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value.toUpperCase())}
                placeholder="Type the answer..."
                className="text-lg font-mono uppercase"
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Look it up in the book and type the answer
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting || !answer.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Your answer will be added to your team's puzzle!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-gray-900" />
        </div>
      }
    >
      <HelpContent />
    </Suspense>
  );
}
