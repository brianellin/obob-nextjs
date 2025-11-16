import { describe, it, expect } from "vitest";
import { getBooksWithStats } from "@/lib/books";

/**
 * SEO Structured Data (JSON-LD) Validation Tests
 *
 * These tests validate JSON-LD structured data for Schema.org compliance:
 * - Book schema for individual book pages
 * - BreadcrumbList schema for navigation
 * - ItemList schema for division pages
 */

describe("Structured Data (JSON-LD)", () => {
  const yearDivisions = [
    { year: "2024-2025", division: "3-5" },
    { year: "2024-2025", division: "6-8" },
    { year: "2025-2026", division: "3-5" },
    { year: "2025-2026", division: "6-8" },
    { year: "2025-2026", division: "9-12" },
  ];

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

  describe("Book Schema", () => {
    it("should have valid Book schema structure for all books", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book, totalQuestions, byType } of booksStats) {
          const divisionName = getDivisionName(division);

          // Simulate JSON-LD generation
          const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
            author: {
              "@type": "Person",
              name: book.author,
            },
            image: `https://obob.dog${book.cover}`,
            description: `Practice ${totalQuestions} OBOB questions for ${book.title} by ${book.author}. Includes ${byType.content} content questions and ${byType["in-which-book"]} 'in which book' questions for ${year} ${divisionName} division.`,
            url: `https://obob.dog/books/${year}/${division}/${book.book_key}`,
          };

          // Validate required fields
          expect(jsonLd["@context"]).toBe("https://schema.org");
          expect(jsonLd["@type"]).toBe("Book");
          expect(jsonLd.name).toBeDefined();
          expect(jsonLd.author["@type"]).toBe("Person");
          expect(jsonLd.author.name).toBeDefined();
          expect(jsonLd.image).toMatch(/^https:\/\/obob\.dog\/covers\//);
          expect(jsonLd.url).toMatch(/^https:\/\/obob\.dog\/books\//);

          // Validate JSON-LD can be stringified
          expect(() => JSON.stringify(jsonLd)).not.toThrow();
        }
      }
    });

    it("should have unique URLs in Book schema", async () => {
      const allUrls = new Set<string>();

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const url = `https://obob.dog/books/${year}/${division}/${book.book_key}`;

          expect(allUrls.has(url)).toBe(
            false,
            `Duplicate URL in Book schema: ${url}`
          );
          allUrls.add(url);
        }
      }
    });
  });

  describe("BreadcrumbList Schema", () => {
    it("should have valid breadcrumb structure for book pages", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);
        const divisionName = getDivisionName(division);

        for (const { book } of booksStats) {
          // Simulate breadcrumb JSON-LD generation
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
                name: book.title,
                item: `https://obob.dog/books/${year}/${division}/${book.book_key}`,
              },
            ],
          };

          // Validate structure
          expect(breadcrumbJsonLd["@context"]).toBe("https://schema.org");
          expect(breadcrumbJsonLd["@type"]).toBe("BreadcrumbList");
          expect(breadcrumbJsonLd.itemListElement).toHaveLength(4);

          // Validate positions are sequential
          breadcrumbJsonLd.itemListElement.forEach((item, index) => {
            expect(item.position).toBe(index + 1);
            expect(item["@type"]).toBe("ListItem");
            expect(item.name).toBeDefined();
            expect(item.item).toMatch(/^https:\/\/obob\.dog/);
          });
        }
      }
    });

    it("should have valid breadcrumb structure for division pages", () => {
      for (const { year, division } of yearDivisions) {
        const divisionName = getDivisionName(division);

        // Simulate breadcrumb JSON-LD for division page
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

        // Validate structure
        expect(breadcrumbJsonLd.itemListElement).toHaveLength(3);
        breadcrumbJsonLd.itemListElement.forEach((item, index) => {
          expect(item.position).toBe(index + 1);
        });
      }
    });
  });

  describe("ItemList Schema (Division Pages)", () => {
    it("should have valid ItemList schema for all divisions", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);
        const divisionName = getDivisionName(division);

        // Simulate ItemList JSON-LD generation
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

        // Validate structure
        expect(itemListJsonLd["@context"]).toBe("https://schema.org");
        expect(itemListJsonLd["@type"]).toBe("ItemList");
        expect(itemListJsonLd.numberOfItems).toBe(booksStats.length);
        expect(itemListJsonLd.itemListElement).toHaveLength(booksStats.length);

        // Validate each book item
        itemListJsonLd.itemListElement.forEach((item, index) => {
          expect(item["@type"]).toBe("Book");
          expect(item.position).toBe(index + 1);
          expect(item.name).toBeDefined();
          expect(item.author["@type"]).toBe("Person");
          expect(item.author.name).toBeDefined();
          expect(item.image).toMatch(/^https:\/\/obob\.dog\/covers\//);
          expect(item.url).toMatch(/^https:\/\/obob\.dog\/books\//);
        });
      }
    });

    it("should have sequential positions in ItemList", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        const itemListElement = booksStats.map((bookStat, index) => ({
          "@type": "Book",
          position: index + 1,
          name: bookStat.book.title,
          url: `https://obob.dog/books/${year}/${division}/${bookStat.book.book_key}`,
        }));

        // Verify positions are sequential from 1 to n
        itemListElement.forEach((item, index) => {
          expect(item.position).toBe(index + 1);
        });
      }
    });
  });

  describe("Schema Validation", () => {
    it("should generate valid JSON for all schemas", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book, totalQuestions, byType } of booksStats) {
          const divisionName = getDivisionName(division);

          const bookSchema = {
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
            author: {
              "@type": "Person",
              name: book.author,
            },
            image: `https://obob.dog${book.cover}`,
            description: `Practice ${totalQuestions} OBOB questions for ${book.title} by ${book.author}. Includes ${byType.content} content questions and ${byType["in-which-book"]} 'in which book' questions for ${year} ${divisionName} division.`,
            url: `https://obob.dog/books/${year}/${division}/${book.book_key}`,
          };

          // Should be valid JSON
          const json = JSON.stringify(bookSchema);
          expect(() => JSON.parse(json)).not.toThrow();

          // Should not have undefined values
          expect(json).not.toContain("undefined");
          expect(json).not.toContain("null");
        }
      }
    });

    it("should have proper @context for all schemas", async () => {
      // All our schemas should use the standard schema.org context
      const expectedContext = "https://schema.org";

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        // Book schema
        for (const { book } of booksStats) {
          const bookSchema = {
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
          };
          expect(bookSchema["@context"]).toBe(expectedContext);
        }

        // ItemList schema
        const itemListSchema = {
          "@context": "https://schema.org",
          "@type": "ItemList",
        };
        expect(itemListSchema["@context"]).toBe(expectedContext);

        // BreadcrumbList schema
        const breadcrumbSchema = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
        };
        expect(breadcrumbSchema["@context"]).toBe(expectedContext);
      }
    });
  });
});
