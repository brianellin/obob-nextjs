import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getBooksWithStats } from "@/lib/books";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllQuestions } from "@/lib/questions";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";

type Props = {
  params: Promise<{
    year: string;
    division: string;
  }>;
};

export function generateStaticParams() {
  return [
    { year: "2024-2025", division: "3-5" },
    { year: "2024-2025", division: "6-8" },
    { year: "2025-2026", division: "3-5" },
    { year: "2025-2026", division: "6-8" },
    { year: "2025-2026", division: "9-12" },
  ];
}

export default async function BooksPage({ params }: Props) {
  const resolvedParams = await params;
  const { year, division } = resolvedParams;

  // Validate parameters
  if (!year || !division) {
    notFound();
  }

  // Validate the specific values
  if (
    !["2024-2025", "2025-2026"].includes(year) ||
    !["3-5", "6-8", "9-12"].includes(division)
  ) {
    notFound();
  }

  let booksStats, allQuestions;
  try {
    [booksStats, allQuestions] = await Promise.all([
      getBooksWithStats(year, division),
      getAllQuestions(year, division),
    ]);
  } catch (error) {
    console.error("Error loading data:", error);
    notFound();
  }

  // Early return if no data
  if (!booksStats || !allQuestions) {
    notFound();
  }

  // Calculate summary statistics more efficiently
  let totalQuestions = 0;
  let contentQuestions = 0;
  let inWhichBookQuestions = 0;
  const sourceCount: Record<string, number> = {};

  for (const bookStat of booksStats) {
    if (bookStat?.totalQuestions) {
      totalQuestions += bookStat.totalQuestions;
    }
    if (bookStat?.byType) {
      contentQuestions += bookStat.byType.content || 0;
      inWhichBookQuestions += bookStat.byType["in-which-book"] || 0;
    }
    if (bookStat?.bySource) {
      for (const [source, count] of Object.entries(bookStat.bySource)) {
        if (typeof count === "number") {
          sourceCount[source] = (sourceCount[source] || 0) + count;
        }
      }
    }
  }

  const summaryStats = {
    totalQuestions,
    byType: {
      content: contentQuestions,
      "in-which-book": inWhichBookQuestions,
    },
    bySource: sourceCount,
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-4xl font-bold">
        OBOB {year} Division {division}
      </h1>

      {/* Summary Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Question Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Total Questions</h3>
              <p className="text-3xl font-bold text-primary">
                {summaryStats.totalQuestions}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Questions by Type</h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span>Content Questions:</span>
                  <Badge variant="secondary">
                    {summaryStats.byType.content}
                  </Badge>
                </li>
                <li className="flex justify-between">
                  <span>In Which Book:</span>
                  <Badge variant="secondary">
                    {summaryStats.byType["in-which-book"]}
                  </Badge>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Questions by Source
              </h3>
              <ScrollArea className="h-[100px]">
                <ul className="space-y-1">
                  {Object.entries(summaryStats.bySource).map(
                    ([source, count]) => (
                      <li key={source} className="flex justify-between">
                        <span>{source}:</span>
                        <Badge variant="outline">{count}</Badge>
                      </li>
                    )
                  )}
                </ul>
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books List */}
      <div className="space-y-4">
        {booksStats.map(({ book, totalQuestions, byType, bySource }) => (
          <Card key={book.book_key}>
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
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{book.title}</h2>
                      <p className="text-muted-foreground">by {book.author}</p>
                    </div>
                    <Link href={`/books/${year}/${division}/${book.book_key}`}>
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Questions
                      </Button>
                    </Link>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                        Questions by Type
                      </h3>
                      <ul className="space-y-1">
                        <li className="flex justify-between">
                          <span>Content Questions:</span>
                          <Badge variant="secondary">{byType.content}</Badge>
                        </li>
                        <li className="flex justify-between">
                          <span>In Which Book:</span>
                          <Badge variant="secondary">
                            {byType["in-which-book"]}
                          </Badge>
                        </li>
                        <li className="flex justify-between font-medium">
                          <span>Total:</span>
                          <Badge>{totalQuestions}</Badge>
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                        Questions by Source
                      </h3>
                      <ScrollArea className="h-[100px]">
                        <ul className="space-y-1">
                          {Object.entries(bySource).map(([source, count]) => (
                            <li key={source} className="flex justify-between">
                              <span>{source}:</span>
                              <Badge variant="outline">{count}</Badge>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
