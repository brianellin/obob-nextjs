"use client";

import React from "react";
import { Question } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { InfoIcon } from "lucide-react";

interface QuestionHeatmapInlineProps {
  questions: Question[];
  selectedPage?: number | null;
  onPageSelect?: (page: number | null) => void;
}

interface PageData {
  page: number;
  count: number;
  questions: Question[];
}

export function QuestionHeatmapInline({
  questions,
  selectedPage = null,
  onPageSelect,
}: QuestionHeatmapInlineProps) {
  // Early return if no questions
  if (!questions || questions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Question Heatmap
          </h3>
          <Badge variant="outline">No questions</Badge>
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <InfoIcon className="h-4 w-4" />
          No questions available for this book
        </div>
      </div>
    );
  }

  // Group questions by page and find min/max in single pass for better performance
  const pageMap: Record<number, PageData> = {};
  let minPage = Infinity;
  let maxPage = -Infinity;

  for (const question of questions) {
    const page = question.page || 0;

    // Update min/max
    if (page < minPage) minPage = page;
    if (page > maxPage) maxPage = page;

    // Group by page
    if (!pageMap[page]) {
      pageMap[page] = { page, count: 0, questions: [] };
    }
    pageMap[page].count++;
    pageMap[page].questions.push(question);
  }

  // Handle edge case where no questions have pages
  if (minPage === Infinity) {
    minPage = 1;
    maxPage = 1;
  }

  // Always start from page 1 to align with navigation
  const startPage = 1;

  // Create array of pages, but limit to reasonable range to prevent performance issues
  const pageRange = maxPage - startPage + 1;
  const MAX_PAGES = 500; // Prevent huge arrays if page numbers are sparse

  let pages: PageData[];

  if (pageRange > MAX_PAGES) {
    // If range is too large, just show pages that actually have questions
    pages = Object.values(pageMap).sort((a, b) => a.page - b.page);
  } else {
    // Normal case: show all pages in range starting from page 1
    pages = Array.from({ length: pageRange }, (_, i) => {
      const page = startPage + i;
      return pageMap[page] || { page, count: 0, questions: [] };
    }).sort((a, b) => a.page - b.page);
  }

  // Get color class based on question count
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-violet-50 dark:bg-violet-950";
    if (count === 1) return "bg-violet-100 dark:bg-violet-900";
    if (count === 2) return "bg-violet-200 dark:bg-violet-800";
    if (count <= 4) return "bg-violet-300 dark:bg-violet-700";
    if (count <= 6) return "bg-violet-400 dark:bg-violet-600";
    if (count <= 8) return "bg-violet-500 dark:bg-violet-500";
    if (count <= 10) return "bg-violet-600 dark:bg-violet-400";
    if (count <= 12) return "bg-violet-700 dark:bg-violet-300";
    return "bg-violet-800 dark:bg-violet-200";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-wrap gap-0.5 items-center w-full">
          {pages.map(({ page, count }) => (
            <button
              key={page}
              onClick={() =>
                onPageSelect?.(selectedPage === page ? null : page)
              }
              className={cn(
                "h-3 w-2 rounded-sm transition-all shrink-0",
                getColorClass(count),
                selectedPage === page && "ring-2 ring-cyan-500"
              )}
              title={`Page ${page}: ${count} question${count !== 1 ? "s" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
