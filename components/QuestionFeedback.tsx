"use client";

import { useState } from "react";
import { Flag, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
        }, 2000);
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
        >
          <Flag className="h-4 w-4" />
          <span className="sr-only">Report question issue</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh]">
        <SheetHeader className="text-left">
          <SheetTitle>Report Question Issue</SheetTitle>
          <SheetDescription>
            Help us improve by reporting any issues with this question.
          </SheetDescription>
        </SheetHeader>

        {isSubmitted ? (
          <div className="py-6 text-center">
            <p className="text-lg font-medium text-green-600">Thank you!</p>
            <p className="text-sm text-gray-600 mt-2">
              Your feedback has been submitted successfully.
            </p>
          </div>
        ) : (
          <>
            <div className="py-4">
              <Textarea
                placeholder="Describe the issue with this question..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px]"
                disabled={isSubmitting}
              />
            </div>

            <SheetFooter>
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
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
