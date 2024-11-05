import React from "react";
import Image from "next/image";
import { getBooksWithStats } from "@/lib/books";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionHeatmapInline } from "@/components/QuestionHeatmapInline";
import { getAllQuestions } from "@/lib/questions";

export default async function BooksPage() {
  const [booksStats, allQuestions] = await Promise.all([
    getBooksWithStats(),
    getAllQuestions()
  ]);

  // Calculate summary statistics
  const summaryStats = booksStats.reduce(
    (acc, { totalQuestions, byType, bySource }) => {
      acc.totalQuestions += totalQuestions;
      acc.byType.content += byType.content;
      acc.byType["in-which-book"] += byType["in-which-book"];
      Object.entries(bySource).forEach(([source, count]) => {
        acc.bySource[source] = (acc.bySource[source] || 0) + count;
      });
      return acc;
    },
    {
      totalQuestions: 0,
      byType: { content: 0, "in-which-book": 0 },
      bySource: {} as Record<string, number>,
    }
  );

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-4xl font-bold">OBOB Books and Questions</h1>

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
                  <div>
                    <h2 className="text-2xl font-bold">{book.title}</h2>
                    <p className="text-muted-foreground">by {book.author}</p>
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

                  <Separator />

                  <QuestionHeatmapInline 
                    questions={allQuestions.filter(q => q.book_key === book.book_key)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
