"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Send, PawPrint } from "lucide-react";

type QuestionSubmissionFormProps = {
  year: string;
  division: string;
  bookKey: string;
  page: number;
  onClose: () => void;
};

export default function QuestionSubmissionForm({
  year,
  division,
  bookKey,
  page,
  onClose,
}: QuestionSubmissionFormProps) {
  const [questionType, setQuestionType] = useState<"content" | "in-which-book">(
    "content"
  );
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [sourceEmail, setSourceEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const questionTextRef = useRef<HTMLTextAreaElement>(null);

  // Load saved user details from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedName = localStorage.getItem("obob-question-form-name");
      const savedEmail = localStorage.getItem("obob-question-form-email");
      const savedLink = localStorage.getItem("obob-question-form-link");

      if (savedName) setSourceName(savedName);
      if (savedEmail) setSourceEmail(savedEmail);
      if (savedLink) setSourceLink(savedLink);
    }
  }, []);

  // Auto-focus question text when form opens
  useEffect(() => {
    if (!isSubmitted) {
      const timer = setTimeout(() => {
        questionTextRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);

  const handleSubmit = async () => {
    if (!questionText.trim() || !sourceName.trim() || !sourceEmail.trim())
      return;
    if (questionType === "content" && !answer.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/questions/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year,
          division,
          bookKey,
          questionType,
          questionText: questionText.trim(),
          page,
          answer: questionType === "content" ? answer.trim() : undefined,
          sourceName: sourceName.trim(),
          sourceLink: sourceLink.trim() || undefined,
          sourceEmail: sourceEmail.trim(),
        }),
      });

      if (response.ok) {
        // Save user details to localStorage for future forms
        if (typeof window !== "undefined") {
          localStorage.setItem("obob-question-form-name", sourceName.trim());
          localStorage.setItem("obob-question-form-email", sourceEmail.trim());
          localStorage.setItem("obob-question-form-link", sourceLink.trim());
        }

        setIsSubmitted(true);
        // Reset form (but keep user details saved)
        setQuestionText("");
        setAnswer("");
        setTimeout(() => {
          onClose();
          setIsSubmitted(false);
        }, 5000);
      } else {
        console.error("Failed to submit question");
      }
    } catch (error) {
      console.error("Error submitting question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Only clear question-specific fields, keep user details for convenience
    setQuestionText("");
    setAnswer("");
    onClose();
  };

  const isFormValid =
    questionText.trim() &&
    sourceName.trim() &&
    sourceEmail.trim() &&
    (questionType === "in-which-book" || answer.trim());

  return (
    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      {isSubmitted ? (
        <div className="py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <p className="text-lg font-medium text-green-600">Woof! Thanks!</p>
            <PawPrint
              className="h-5 w-5 text-black drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
              style={{ filter: "drop-shadow(0 0 2px rgba(255,255,255,0.9))" }}
            />
          </div>
          <p className="text-sm text-gray-600">
            Your question has been submitted for review. Keep reading!
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Submit a Question
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Add a question for page {page} of this book.
            </p>

            {/* Question Type Toggle */}
            <div className="mb-4">
              <ToggleGroup
                type="single"
                value={questionType}
                onValueChange={(value) =>
                  value && setQuestionType(value as "content" | "in-which-book")
                }
                className="justify-start"
              >
                <ToggleGroupItem
                  value="content"
                  className="text-sm data-[state=on]:bg-black data-[state=on]:text-white hover:bg-gray-100"
                >
                  Content
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="in-which-book"
                  className="text-sm data-[state=on]:bg-black data-[state=on]:text-white hover:bg-gray-100"
                >
                  In Which Book
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {questionType === "content"
                ? "Content question"
                : "In which book..."}
            </label>
            <Textarea
              ref={questionTextRef}
              placeholder={
                questionType === "content"
                  ? "Where does Rosie go on her daily walks?"
                  : "does a does a character receive a hatchet as a gift?"
              }
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="min-h-[60px] bg-white"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              {questionType === "content"
                ? "Tip: Ask about specific details, characters, or events on this page"
                : "Tip: Ask a question that could apply to multiple books in the competition. Do not repeat the `In which book...` portion of the question"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Bonus tip: Be unique! Review the existing questions below before
              submitting to make sure your question isn&apos;t a duplicate.
            </p>
          </div>

          {/* Answer field - only for content questions */}
          {questionType === "content" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Answer *
              </label>
              <Textarea
                placeholder="Mt. Tabor Park"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-[60px] bg-white"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Be brief! Your answer should be a single word or phrase
                that can be evaluated objectively.
              </p>
            </div>
          )}

          {/* Source Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <Input
                placeholder="Enter your name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="bg-white"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <Input
                type="email"
                placeholder="your.email@example.com"
                value={sourceEmail}
                onChange={(e) => setSourceEmail(e.target.value)}
                className="bg-white"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Optional source link */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Link (optional)
            </label>
            <Input
              type="url"
              placeholder="https://example.com (if applicable)"
              value={sourceLink}
              onChange={(e) => setSourceLink(e.target.value)}
              className="bg-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="sm:order-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="sm:order-1"
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
          </div>
        </>
      )}
    </div>
  );
}
