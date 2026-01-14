"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Send, Check } from "lucide-react";
import RosieIcon from "@/components/RosieIcon";

interface CrosswordFeedbackProps {
  teamCode: string;
  year: string;
  division: string;
  puzzleDate: string;
}

export function CrosswordFeedback({
  teamCode,
  year,
  division,
  puzzleDate,
}: CrosswordFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/crossword-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: feedback.trim(),
          email: email.trim() || undefined,
          teamCode,
          year,
          division,
          puzzleDate,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFeedback("");
        setEmail("");
        setTimeout(() => {
          setIsSubmitted(false);
          setIsExpanded(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="h-5 w-5 text-green-600" />
        </div>
        <p className="text-green-800 font-medium">Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-amber-100/50 transition-colors text-left"
      >
        <RosieIcon className="w-8 h-8 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-900">
            Daily Crossword is new! We&apos;re looking for feedback.
          </p>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-amber-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-amber-600 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-4 pt-0 space-y-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What do you think? Any suggestions or issues?"
            className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            rows={3}
          />
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional, for follow-up)"
              className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            <p className="text-xs text-amber-700 mt-1">
              By providing your email, you confirm you are 13 or older, or have
              parental permission.
            </p>
          </div>
          <Button
            type="submit"
            disabled={!feedback.trim() || isSubmitting}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? (
              "Sending..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Feedback
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
