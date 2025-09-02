"use client";

import { useState, useEffect, useRef } from "react";
import { Flag, Send, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { QuestionWithBook } from "@/types";

type QuestionFeedbackProps = {
  question: QuestionWithBook;
  year: string;
  division: string;
};

export default function QuestionFeedback({
  question,
  year,
  division,
}: QuestionFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when sheet opens
  useEffect(() => {
    if (isOpen && !isSubmitted) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSubmitted]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setFeedback("");
    }
  }, [isOpen]);

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
          setIsOpen(false);
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
        >
          <Flag className="h-4 w-4" />
          <span className="sr-only">Report question issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Question Issue</DialogTitle>
          <DialogDescription>
            Help us improve by reporting any issues with this question.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PawPrint className="h-5 w-5 text-black" />
              <p className="text-lg font-medium text-green-600">
                Thanks! Woof!
              </p>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Thanks for helping us make obob.dog better. Keep reading!
            </p>
          </div>
        ) : (
          <>
            <div className="py-4">
              <Textarea
                ref={textareaRef}
                placeholder="Describe the issue with this question..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>

            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={!feedback.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
