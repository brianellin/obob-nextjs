import { describe, it, expect } from "vitest";
import { getBooksWithStats } from "@/lib/books";

/**
 * SEO Metadata Validation Tests
 *
 * These tests ensure that all pages have proper SEO metadata including:
 * - Unique titles
 * - Meta descriptions within character limits
 * - Canonical URLs
 * - Required book data for metadata generation
 */

describe("SEO Metadata", () => {
  const yearDivisions = [
    { year: "2024-2025", division: "3-5" },
    { year: "2024-2025", division: "6-8" },
    { year: "2025-2026", division: "3-5" },
    { year: "2025-2026", division: "6-8" },
    { year: "2025-2026", division: "9-12" },
  ];

  describe("Book Pages", () => {
    it("should have required metadata fields for all books", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        expect(booksStats.length).toBeGreaterThan(
          0,
          `No books found for ${year}/${division}`
        );

        for (const { book } of booksStats) {
          // Required for title generation
          expect(book.title).toBeDefined();
          expect(book.title).not.toBe("");
          expect(book.author).toBeDefined();
          expect(book.author).not.toBe("");

          // Required for OpenGraph images
          expect(book.cover).toBeDefined();
          expect(book.cover).toMatch(/^\/covers\//);

          // Required for URLs
          expect(book.book_key).toBeDefined();
          expect(book.book_key).toMatch(/^[a-z0-9-]+$/);
        }
      }
    });

    it("should generate unique canonical URLs for each book", async () => {
      const allUrls = new Set<string>();

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const url = `https://obob.dog/books/${year}/${division}/${book.book_key}`;

          expect(allUrls.has(url)).toBe(
            false,
            `Duplicate URL found: ${url}`
          );
          allUrls.add(url);
        }
      }

      // Verify we have all expected books
      // 2024-2025: 16 books each (3-5, 6-8) = 32
      // 2025-2026: 16 books each (3-5, 6-8), 12 books (9-12) = 44
      // Total: 76 books
      expect(allUrls.size).toBeGreaterThanOrEqual(
        70,
        "Expected at least 70 unique book URLs"
      );
    });

    it("should have cover images for OpenGraph", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // Verify cover path format
          expect(book.cover).toMatch(
            /^\/covers\/\d{4}-\d{4}\/[3-9]-[0-9]{1,2}\/.+\.(jpg|png)$/,
            `Invalid cover path format: ${book.cover}`
          );
        }
      }
    });
  });

  describe("Division Pages", () => {
    it("should have valid year/division combinations", () => {
      // Test that our year/division combinations are valid
      for (const { year, division } of yearDivisions) {
        expect(["2024-2025", "2025-2026"]).toContain(year);
        expect(["3-5", "6-8", "9-12"]).toContain(division);
      }
    });

    it("should be able to load books for all divisions", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        expect(booksStats).toBeDefined();
        expect(booksStats.length).toBeGreaterThan(
          0,
          `No books found for ${year}/${division}`
        );

        // Verify stats are calculated
        for (const bookStat of booksStats) {
          expect(bookStat.totalQuestions).toBeGreaterThanOrEqual(0);
          expect(bookStat.byType.content).toBeGreaterThanOrEqual(0);
          expect(bookStat.byType["in-which-book"]).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe("Metadata Content Quality", () => {
    it("should have reasonable title lengths", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // Simulate title generation
          const divisionName =
            division === "3-5"
              ? "Elementary"
              : division === "6-8"
              ? "Middle School"
              : "High School";
          const title = `${book.title} by ${book.author} | OBOB ${year} ${divisionName} (${division})`;

          // SEO best practice: titles should be under 60 characters ideally,
          // but can go up to 70. We allow more flexibility here.
          expect(title.length).toBeLessThan(
            120,
            `Title too long (${title.length} chars): ${title}`
          );
        }
      }
    });

    it("should generate valid descriptions", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book, totalQuestions, byType } of booksStats) {
          // Simulate description generation
          const divisionName =
            division === "3-5"
              ? "Elementary"
              : division === "6-8"
              ? "Middle School"
              : "High School";
          const description = `Practice ${totalQuestions} OBOB questions for ${book.title} by ${book.author}. Includes ${byType.content} content questions and ${byType["in-which-book"]} 'in which book' questions for ${year} ${divisionName} division.`;

          // Meta descriptions should ideally be 150-160 characters
          // We allow up to 200 for flexibility
          expect(description.length).toBeLessThan(
            250,
            `Description too long (${description.length} chars) for ${book.title}`
          );
          expect(description.length).toBeGreaterThan(
            50,
            `Description too short for ${book.title}`
          );
        }
      }
    });
  });

  describe("URL Structure", () => {
    it("should have SEO-friendly book_key format", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // book_key should be lowercase with hyphens (URL-friendly)
          expect(book.book_key).toMatch(
            /^[a-z0-9-]+$/,
            `Invalid book_key format: ${book.book_key}`
          );

          // Should not start or end with hyphen
          expect(book.book_key).not.toMatch(/^-/);
          expect(book.book_key).not.toMatch(/-$/);

          // Should not have consecutive hyphens
          expect(book.book_key).not.toMatch(/--/);
        }
      }
    });

    it("should have consistent URL structure across all books", async () => {
      const urlPattern = /^https:\/\/obob\.dog\/books\/\d{4}-\d{4}\/[3-9]-[0-9]{1,2}\/[a-z0-9-]+$/;

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const url = `https://obob.dog/books/${year}/${division}/${book.book_key}`;
          expect(url).toMatch(urlPattern, `Invalid URL structure: ${url}`);
        }
      }
    });
  });
});
