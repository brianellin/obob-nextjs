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
import { BookOpen, Download, User, Users, Swords } from "lucide-react";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    year: string;
    division: string;
  }>;
};

function getDivisionName(division: string): string {
  switch (division) {
    case "3-5":
      return "Elementary";
    case "6-8":
      return "Middle School";
    case "9-12":
      return "High School";
    default:
      return division;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { year, division } = resolvedParams;

  // Validate parameters
  if (
    !year ||
    !division ||
    !["2024-2025", "2025-2026"].includes(year) ||
    !["3-5", "6-8", "9-12"].includes(division)
  ) {
    return {
      title: "Books Not Found | OBOB",
      description: "The requested division could not be found.",
    };
  }

  try {
    const booksStats = await getBooksWithStats(year, division);

    if (!booksStats || booksStats.length === 0) {
      return {
        title: "Books Not Found | OBOB",
        description: "No books found for this division.",
      };
    }

    const divisionName = getDivisionName(division);
    const bookCount = booksStats.length;

    // Calculate total questions
    let totalQuestions = 0;
    for (const bookStat of booksStats) {
      if (bookStat?.totalQuestions) {
        totalQuestions += bookStat.totalQuestions;
      }
    }

    const title = `OBOB ${year} ${divisionName} (${division}) - ${bookCount} Books`;
    const description = `Browse ${bookCount} books and practice ${totalQuestions.toLocaleString()} OBOB questions for the ${year} ${divisionName} division. View questions by book, download practice sets, and start battles.`;
    const url = `https://obob.dog/books/${year}/${division}`;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        type: "website",
        url,
        title,
        description,
        siteName: "OBOB.dog",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Books Not Found | OBOB",
      description: "The requested division could not be found.",
    };
  }
}

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

  // Create JSON-LD ItemList schema
  const divisionName = getDivisionName(division);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `OBOB ${year} ${divisionName} Books`,
    description: `Complete list of ${booksStats.length} books for the ${year} ${divisionName} division`,
    numberOfItems: booksStats.length,
    itemListElement: booksStats.map((bookStat, index) => ({
      "@type": "Book",
      position: index + 1,
      name: bookStat.book.title,
      author: {
        "@type": "Person",
        name: bookStat.book.author,
      },
      image: `https://obob.dog${bookStat.book.cover}`,
      url: `https://obob.dog/books/${year}/${division}/${bookStat.book.book_key}`,
    })),
  };

  // Create breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://obob.dog",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Books",
        item: "https://obob.dog/books",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${year} ${divisionName}`,
        item: `https://obob.dog/books/${year}/${division}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading">
                OBOB {year} {divisionName}
              </h1>
              <p className="text-muted-foreground mt-1">
                Division {division} • {booksStats.length} Books
              </p>
            </div>
            <a
              href={`/exports/${year}/${division}/obob-${year}-${division}-all-questions.csv`}
              download
            >
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Download All Questions</span>
              </Button>
            </a>
          </div>
        </div>

        {/* Battle CTA Section */}
        <Card className="bg-gradient-to-r from-purple-50 to-cyan-50 border-2 border-purple-200">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2 font-heading">
                  <Swords className="h-6 w-6 text-purple-600" />
                  Ready to Battle?
                </h2>
                <p className="text-muted-foreground">
                  Practice with all {booksStats.length} books from the {year}{" "}
                  {divisionName} division
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/battle/${year}/${division}?mode=personal`}>
                  <Button size="lg" variant="default" className="w-full sm:w-auto">
                    <User className="h-5 w-5 mr-2" />
                    Practice Solo
                  </Button>
                </Link>
                <Link href={`/battle/${year}/${division}?mode=friend`}>
                  <Button size="lg" variant="default" className="w-full sm:w-auto">
                    <Users className="h-5 w-5 mr-2" />
                    Battle with Friend
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Summary Statistics Section */}
      <Card>
        <CardHeader>
          <CardTitle>Question Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 font-heading">Total Questions</h3>
              <p className="text-3xl font-bold text-primary">
                {summaryStats.totalQuestions}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 font-heading">Questions by Type</h3>
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
              <h3 className="font-semibold text-lg mb-2 font-heading">
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
      <div className="space-y-3 md:space-y-4">
        {booksStats.map(({ book, totalQuestions, byType, bySource }) => (
          <Card key={book.book_key}>
            <CardContent className="px-4 py-3 md:px-6 md:py-4">
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
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

                <div className="flex-grow space-y-2 md:space-y-3">
                  {/* Title/Author and Button - responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-grow">
                      <h2 className="text-2xl font-bold font-heading">{book.title}</h2>
                      <p className="text-muted-foreground">by {book.author}</p>
                      {book.author_pronunciation && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <span className="italic">({book.author_pronunciation})</span>
                          {book.pronunciation_source && (
                            <a
                              href={book.pronunciation_source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cyan-600 hover:text-cyan-800 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                              </svg>
                              <span className="text-xs">Listen</span>
                            </a>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        href={`/books/${year}/${division}/${book.book_key}`}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Questions
                        </Button>
                      </Link>
                    </div>
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
    </>
  );
}
