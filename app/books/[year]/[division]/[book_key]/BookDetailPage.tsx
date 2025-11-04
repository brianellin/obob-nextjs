"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Download } from "lucide-react";
import { Book, Question } from "@/types";
import { QuestionHeatmapInline } from "@/components/QuestionHeatmapInline";
import QuestionSubmissionForm from "@/components/QuestionSubmissionForm";

interface BookPageProps {
  book: Book;
  questions: Question[];
  year: string;
  division: string;
}

export default function BookDetailPage({
  book,
  questions,
  year,
  division,
}: BookPageProps) {
  // Group questions by page
  const questionsByPage = useMemo(() => {
    const grouped: Record<number, Question[]> = {};
    questions.forEach((question) => {
      if (!grouped[question.page]) {
        grouped[question.page] = [];
      }
      grouped[question.page].push(question);
    });
    return grouped;
  }, [questions]);

  // Get all page numbers in range (including pages with no questions)
  const pageNumbers = useMemo(() => {
    if (questions.length === 0) return [];

    // Extract page numbers directly from questions
    const pagesWithQuestions = questions
      .map((q) => q.page)
      .filter((page) => typeof page === "number" && page > 0)
      .sort((a, b) => a - b);

    if (pagesWithQuestions.length === 0) return [];

    const maxPage = Math.max(...pagesWithQuestions);

    // Always start from page 1 to include all pages in the book
    const minPage = 1;

    // Create array of all pages from 1 to max
    return Array.from({ length: maxPage - minPage + 1 }, (_, i) => minPage + i);
  }, [questions]);

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  const currentPage = pageNumbers[currentPageIndex] || 1;
  const currentQuestions = questionsByPage[currentPage] || [];

  // Calculate stats
  const stats = useMemo(() => {
    const totalQuestions = questions.length;
    const contentQuestions = questions.filter(
      (q) => q.type === "content"
    ).length;
    const inWhichBookQuestions = questions.filter(
      (q) => q.type === "in-which-book"
    ).length;

    const bySource: Record<string, number> = {};
    questions.forEach((question) => {
      if (question.source) {
        bySource[question.source.name] =
          (bySource[question.source.name] || 0) + 1;
      }
    });

    // Calculate page statistics
    const pagesWithQuestions = Object.keys(questionsByPage).length;
    const maxPage =
      questions.length > 0
        ? Math.max(
            ...questions
              .map((q) => q.page)
              .filter((p) => typeof p === "number" && p > 0)
          )
        : 0;
    const pagesWithoutQuestions = Math.max(0, maxPage - pagesWithQuestions);

    return {
      totalQuestions,
      byType: {
        content: contentQuestions,
        "in-which-book": inWhichBookQuestions,
      },
      bySource,
      pagesWithQuestions,
      pagesWithoutQuestions,
      maxPage,
    };
  }, [questions, questionsByPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
      setPageInput("");
    }
  }, [currentPageIndex]);

  const handleNextPage = useCallback(() => {
    if (currentPageIndex < pageNumbers.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
      setPageInput("");
    }
  }, [currentPageIndex, pageNumbers.length]);

  const handlePageJump = () => {
    const targetPage = parseInt(pageInput);
    const targetIndex = pageNumbers.findIndex((page) => page === targetPage);
    if (targetIndex !== -1) {
      setCurrentPageIndex(targetIndex);
      setPageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePageJump();
    }
  };

  // Handle page selection from heatmap
  const handleHeatmapPageSelect = (page: number | null) => {
    if (page !== null) {
      const targetIndex = pageNumbers.findIndex((p) => p === page);
      if (targetIndex !== -1) {
        setCurrentPageIndex(targetIndex);
        setPageInput("");
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          handlePreviousPage();
          break;
        case "ArrowRight":
          event.preventDefault();
          handleNextPage();
          break;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handlePreviousPage, handleNextPage]); // Dependencies for the navigation functions

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Back navigation */}
      <div className="flex items-center justify-between gap-2">
        <Link href={`/books/${year}/${division}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Books
          </Button>
        </Link>
        <a
          href={`/exports/${year}/${division}/${book.book_key}-${year}-${division}.csv`}
          download
        >
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Download Questions</span>
          </Button>
        </a>
      </div>

      {/* Book Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="relative w-32 h-48">
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  className="object-cover rounded-md"
                  sizes="128px"
                />
              </div>
            </div>

            <div className="flex-grow space-y-4">
              <div>
                <h1 className="text-3xl font-bold">{book.title}</h1>
                <p className="text-xl text-muted-foreground">
                  by {book.author}
                </p>
                <Badge variant="secondary" className="mt-2">
                  {year} • Division {division}
                </Badge>
              </div>

              <Separator />

              {/* Question Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Question Stats</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Total Questions:</span>
                      <Badge>{stats.totalQuestions}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Pages with Questions:</span>
                      <Badge variant="secondary">
                        {stats.pagesWithQuestions}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Pages without Questions:</span>
                      <Badge variant="outline">
                        {stats.pagesWithoutQuestions}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">By Type</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Content Questions:</span>
                      <Badge variant="secondary">{stats.byType.content}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>In Which Book:</span>
                      <Badge variant="secondary">
                        {stats.byType["in-which-book"]}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">By Source</h3>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {Object.entries(stats.bySource).map(([source, count]) => (
                      <div key={source} className="flex justify-between">
                        <span className="text-sm">{source}:</span>
                        <Badge variant="outline" className="text-xs">
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Browser */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Questions by page</span>
            {pageNumbers.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Page {currentPage}{" "}
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Heatmap */}
          <div>
            <QuestionHeatmapInline
              questions={questions}
              selectedPage={currentPage}
              onPageSelect={handleHeatmapPageSelect}
            />
          </div>

          {pageNumbers.length > 0 && (
            <>
              <Separator />

              {/* Page Navigation Controls - single row with jump controls in middle */}
              <div className="flex items-center justify-between gap-2 md:gap-4">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPageIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">Previous</span>
                </Button>

                {/* Jump to page controls in the middle */}
                <div className="flex items-center gap-2">
                  <span className="hidden md:inline text-sm text-muted-foreground">
                    Jump to page:
                  </span>
                  <Input
                    type="number"
                    placeholder="Page #"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-16 md:w-24"
                    min={pageNumbers.length > 0 ? Math.min(...pageNumbers) : 1}
                    max={pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1}
                  />
                  <Button
                    onClick={handlePageJump}
                    size="sm"
                    disabled={
                      !pageInput ||
                      pageInput.trim() === "" ||
                      isNaN(Number(pageInput)) ||
                      pageNumbers.length === 0 ||
                      Number(pageInput) < Math.min(...pageNumbers) ||
                      Number(pageInput) > Math.max(...pageNumbers)
                    }
                  >
                    Go
                  </Button>
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPageIndex === pageNumbers.length - 1}
                >
                  <span className="hidden md:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Separator />

              {/* Questions for Current Page */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Page {currentPage}: {currentQuestions.length} question
                    {currentQuestions.length === 1 ? "" : "s"}
                  </h3>
                  <Button
                    onClick={() => setShowSubmissionForm(!showSubmissionForm)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </Button>
                </div>

                {/* Question Submission Form */}
                {showSubmissionForm && (
                  <QuestionSubmissionForm
                    year={year}
                    division={division}
                    bookKey={book.book_key}
                    page={currentPage}
                    onClose={() => setShowSubmissionForm(false)}
                  />
                )}
                {currentQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">
                      No questions for page {currentPage} yet.
                    </p>
                  </div>
                ) : (
                  currentQuestions.map((question, index) => (
                    <Card
                      key={index}
                      className="border-l-4 border-l-primary/20"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant={
                                  question.type === "content"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {question.type === "content"
                                  ? "Content"
                                  : "In Which Book"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                Page {question.page}
                              </span>
                              {question.source && (
                                <Badge variant="outline" className="text-xs">
                                  {question.source.name}
                                </Badge>
                              )}
                              {question.contributor && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {question.contributor}
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm leading-relaxed mb-2">
                              <strong>Q:</strong> {question.text}
                            </p>

                            {question.type === "content" &&
                              "answer" in question && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>A:</strong> {question.answer}
                                </p>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}

          {pageNumbers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                No questions available for this book.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
