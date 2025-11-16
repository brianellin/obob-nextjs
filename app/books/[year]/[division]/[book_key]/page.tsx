import React from "react";
import { notFound } from "next/navigation";
import { getBooksWithStats } from "@/lib/books";
import { getAllQuestions } from "@/lib/questions";
import BookDetailPage from "./BookDetailPage";
import type { Metadata } from "next";

type Props = {
  params: Promise<{
    year: string;
    division: string;
    book_key: string;
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
  const { year, division, book_key } = resolvedParams;

  // Validate parameters
  if (
    !year ||
    !division ||
    !book_key ||
    !["2024-2025", "2025-2026"].includes(year) ||
    !["3-5", "6-8", "9-12"].includes(division)
  ) {
    return {
      title: "Book Not Found | OBOB",
      description: "The requested book could not be found.",
    };
  }

  try {
    const [booksStats, allQuestions] = await Promise.all([
      getBooksWithStats(year, division),
      getAllQuestions(year, division),
    ]);

    if (!booksStats || !allQuestions) {
      return {
        title: "Book Not Found | OBOB",
        description: "The requested book could not be found.",
      };
    }

    const bookStats = booksStats.find((b) => b.book.book_key === book_key);
    if (!bookStats) {
      return {
        title: "Book Not Found | OBOB",
        description: "The requested book could not be found.",
      };
    }

    const { book, totalQuestions, byType } = bookStats;
    const divisionName = getDivisionName(division);
    const title = `${book.title} by ${book.author} | OBOB ${year} ${divisionName} (${division})`;
    const description = `Practice ${totalQuestions} OBOB questions for ${book.title} by ${book.author}. Includes ${byType.content} content questions and ${byType["in-which-book"]} 'in which book' questions for ${year} ${divisionName} division.`;
    const url = `https://obob.dog/books/${year}/${division}/${book_key}`;

    // Use book cover for OpenGraph image
    const ogImage = `https://obob.dog${book.cover}`;

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
        images: [
          {
            url: ogImage,
            width: 400,
            height: 600,
            alt: `${book.title} book cover`,
          },
        ],
        siteName: "OBOB.dog",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Book Not Found | OBOB",
      description: "The requested book could not be found.",
    };
  }
}

export async function generateStaticParams() {
  const fs = await import("fs/promises");
  const path = await import("path");

  const yearDivisions = [
    { year: "2024-2025", division: "3-5" },
    { year: "2024-2025", division: "6-8" },
    { year: "2025-2026", division: "3-5" },
    { year: "2025-2026", division: "6-8" },
    { year: "2025-2026", division: "9-12" },
  ];

  const params = [];

  for (const { year, division } of yearDivisions) {
    try {
      const booksPath = path.join(
        process.cwd(),
        "public",
        "obob",
        year,
        division,
        "books.json"
      );
      const booksFile = await fs.readFile(booksPath, "utf8");
      const booksData = JSON.parse(booksFile) as {
        books: Record<string, { book_key: string }>;
      };
      const bookKeys = Object.keys(booksData.books);

      for (const book_key of bookKeys) {
        params.push({ year, division, book_key });
      }
    } catch (error) {
      console.error(`Error loading books for ${year}/${division}:`, error);
    }
  }

  return params;
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const { year, division, book_key } = resolvedParams;

  // Validate parameters
  if (!year || !division || !book_key) {
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

  // Find the specific book
  const bookStats = booksStats.find((b) => b.book.book_key === book_key);
  if (!bookStats) {
    notFound();
  }

  // Filter questions for this book
  const bookQuestions = allQuestions.filter((q) => q.book_key === book_key);

  // Create JSON-LD structured data
  const divisionName = getDivisionName(division);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: bookStats.book.title,
    author: {
      "@type": "Person",
      name: bookStats.book.author,
    },
    image: `https://obob.dog${bookStats.book.cover}`,
    description: `Practice ${bookStats.totalQuestions} OBOB questions for ${bookStats.book.title} by ${bookStats.book.author}. Includes ${bookStats.byType.content} content questions and ${bookStats.byType["in-which-book"]} 'in which book' questions for ${year} ${divisionName} division.`,
    url: `https://obob.dog/books/${year}/${division}/${book_key}`,
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
      {
        "@type": "ListItem",
        position: 4,
        name: bookStats.book.title,
        item: `https://obob.dog/books/${year}/${division}/${book_key}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BookDetailPage
        book={bookStats.book}
        questions={bookQuestions}
        year={year}
        division={division}
      />
    </>
  );
}
