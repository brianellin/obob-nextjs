"use client";

import { useState, useEffect, useRef } from "react";
import { Send, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionWithBook } from "@/types";

type QuestionFeedbackFormProps = {
  question: QuestionWithBook;
  year: string;
  division: string;
  onClose: () => void;
};

export default function QuestionFeedbackForm({
  question,
  year,
  division,
  onClose,
}: QuestionFeedbackFormProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when form opens
  useEffect(() => {
    if (!isSubmitted) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: feedback.trim(),
          questionData: {
            year,
            division,
            book: question.book,
            question: {
              type: question.type,
              text: question.text,
              page: question.page,
              answer: question.type === "content" ? question.answer : undefined,
            },
            source: question.source,
          },
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFeedback("");
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
        }, 5000);
      } else {
        console.error("Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFeedback("");
    onClose();
  };

  return (
    <div className="mt-4 p-4 bg-pink-50 border border-pink-200 rounded-lg">
      {isSubmitted ? (
        <div className="py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-lg font-medium text-green-600">Woof! Thanks!</p>
            <PawPrint className="h-5 w-5 text-black" />
          </div>
          <p className="text-sm text-gray-600">
            Thanks for helping us make obob.dog better. Keep reading!
          </p>
        </div>
      ) : (
        <>
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Ruh Roh!</h3>
            <p className="text-sm text-gray-600">
              Something wrong with this question?
            </p>
          </div>

          <div className="mb-4">
            <Textarea
              ref={textareaRef}
              placeholder="Describe the issue with this question..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmit}
              disabled={!feedback.trim() || isSubmitting}
              className="flex-1"
              size="sm"
            >
              {isSubmitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
