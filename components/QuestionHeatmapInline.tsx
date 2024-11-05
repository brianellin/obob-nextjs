"use client";

import React, { useState } from "react";
import { Question } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InfoIcon } from "lucide-react";

interface QuestionHeatmapInlineProps {
  questions: Question[];
}

interface PageData {
  page: number;
  count: number;
  questions: Question[];
}

export function QuestionHeatmapInline({
  questions,
}: QuestionHeatmapInlineProps) {
  const [selectedPage, setSelectedPage] = useState<number | null>(null);

  // Group questions by page
  const pageMap = questions.reduce((acc, question) => {
    const page = question.page || 0;
    if (!acc[page]) {
      acc[page] = { page, count: 0, questions: [] };
    }
    acc[page].count++;
    acc[page].questions.push(question);
    return acc;
  }, {} as Record<number, PageData>);

  // Find min and max pages
  const minPage = Math.min(...questions.map((q) => q.page || 0));
  const maxPage = Math.max(...questions.map((q) => q.page || 0));

  // Create array of all pages in range
  const pages = Array.from({ length: maxPage - minPage + 1 }, (_, i) => {
    const page = minPage + i;
    return pageMap[page] || { page, count: 0, questions: [] };
  }).sort((a, b) => a.page - b.page);

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
        <div className="text-sm font-medium">Questions by Page</div>
        <div className="flex flex-wrap gap-0.5 items-center w-full">
          {pages.map(({ page, count }) => (
            <button
              key={page}
              onClick={() =>
                setSelectedPage(selectedPage === page ? null : page)
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

      {selectedPage !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Page {selectedPage + 1}</h3>
            <Badge variant="secondary">
              {pageMap[selectedPage]?.count || 0} question
              {(pageMap[selectedPage]?.count || 0) !== 1 ? "s" : ""}
            </Badge>
          </div>
          <ScrollArea className="h-[250px] w-full border rounded-md p-4">
            {pageMap[selectedPage]?.questions.length > 0 ? (
              <ul className="space-y-4">
                {pageMap[selectedPage].questions.map(
                  (q: Question, i: number) => (
                    <li key={i} className="space-y-1">
                      <div className="flex items-start gap-2">
                        <Badge
                          variant={
                            q.type === "content" ? "default" : "secondary"
                          }
                        >
                          {q.type === "content" ? "C" : "IWB"}
                        </Badge>
                        <span className="text-sm">{q.text}</span>
                      </div>
                      {q.type === "content" && q.answer && (
                        <div className="text-sm text-muted-foreground pl-8">
                          Answer: {q.answer}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground pl-8">
                        Source: {String(q.source?.name || "Unknown")}
                      </div>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <InfoIcon className="h-4 w-4" />
                No questions on this page
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
