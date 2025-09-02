"use client";

import { useState, useEffect, useRef } from "react";
import { Flag, Send, PawPrint } from "lucide-react";
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
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect if device is mobile/touch device
  useEffect(() => {
    const checkIfMobile = () => {
      const isTouchDevice =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isTouchDevice && isSmallScreen);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Handle visual viewport changes (keyboard open/close on mobile)
  useEffect(() => {
    if (!isMobile) return;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const keyboardOpen = window.visualViewport.height < window.innerHeight;
        if (keyboardOpen) {
          const kbHeight = window.innerHeight - window.visualViewport.height;
          setKeyboardHeight(kbHeight);
        } else {
          setKeyboardHeight(0);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange);
      return () => {
        window.visualViewport?.removeEventListener(
          "resize",
          handleViewportChange
        );
      };
    }
  }, [isMobile]);

  // Handle focus when sheet opens (desktop only)
  useEffect(() => {
    if (isOpen && !isMobile && !isSubmitted) {
      // For desktop, focus after a short delay to let the sheet animation complete
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobile, isSubmitted]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setFeedback("");
      setKeyboardHeight(0);
    }
  }, [isOpen]);

  // Handle textarea focus on mobile to ensure visibility
  const handleTextareaFocus = () => {
    if (isMobile) {
      // Delay to let keyboard animation start
      setTimeout(() => {
        textareaRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
    }
  };

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
      <SheetContent side="right">
        <SheetHeader className="text-left">
          <SheetTitle>Report Question Issue</SheetTitle>
          <SheetDescription>
            Help us improve by reporting any issues with this question.
          </SheetDescription>
        </SheetHeader>

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
                onFocus={handleTextareaFocus}
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
