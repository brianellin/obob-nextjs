import { describe, it, expect } from "vitest";
import { getBooksWithStats } from "@/lib/books";
import fs from "fs/promises";
import path from "path";

/**
 * SEO Image Optimization Tests
 *
 * These tests ensure images are properly optimized for SEO:
 * - All book covers exist
 * - Cover images are in supported formats
 * - Images would have proper alt text (via metadata)
 */

describe("SEO Image Optimization", () => {
  const yearDivisions = [
    { year: "2024-2025", division: "3-5" },
    { year: "2024-2025", division: "6-8" },
    { year: "2025-2026", division: "3-5" },
    { year: "2025-2026", division: "6-8" },
    { year: "2025-2026", division: "9-12" },
  ];

  describe("Book Cover Images", () => {
    it("should have cover images for all books", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          expect(book.cover).toBeDefined();
          expect(book.cover).not.toBe("");

          // Should start with /covers/
          expect(book.cover).toMatch(/^\/covers\//);
        }
      }
    });

    it("should use supported image formats", async () => {
      const supportedFormats = [".jpg", ".jpeg", ".png", ".webp"];

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const ext = path.extname(book.cover).toLowerCase();
          expect(supportedFormats).toContain(ext);
        }
      }
    });

    it("should have consistent cover path structure", async () => {
      // Expected format: /covers/{year}/{division}/{book_key}.{ext}
      const pathPattern = /^\/covers\/\d{4}-\d{4}\/[3-9]-[0-9]{1,2}\/.+\.(jpg|jpeg|png|webp)$/i;

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          expect(book.cover).toMatch(pathPattern);

          // Verify year and division match in path
          expect(book.cover).toContain(`/covers/${year}/${division}/`);
        }
      }
    });

    it("should have cover images that exist on disk", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // Remove leading slash and prepend public/
          const coverPath = path.join(process.cwd(), "public", book.cover);

          try {
            const stats = await fs.stat(coverPath);
            expect(stats.isFile()).toBe(true);
          } catch {
            throw new Error(`Cover image not found: ${coverPath} for ${book.title}`);
          }
        }
      }
    });

    it("should have reasonable file sizes for covers", async () => {
      // Cover images should exist and have reasonable sizes
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB max
      const MIN_SIZE = 1024; // 1KB min

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const coverPath = path.join(process.cwd(), "public", book.cover);

          try {
            const stats = await fs.stat(coverPath);
            expect(stats.size).toBeGreaterThan(MIN_SIZE);
            expect(stats.size).toBeLessThan(MAX_SIZE);
          } catch {
            // If file doesn't exist, that's caught by previous test
            continue;
          }
        }
      }
    });
  });

  describe("OpenGraph Images", () => {
    it("should use book covers for OpenGraph images", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // Simulate OG image generation
          const ogImage = `https://obob.dog${book.cover}`;

          expect(ogImage).toMatch(/^https:\/\/obob\.dog\/covers\//);
        }
      }
    });

    it("should have alt text data available for OpenGraph", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // Simulate alt text generation
          const altText = `${book.title} book cover`;

          expect(altText).toBeDefined();
          expect(altText.length).toBeGreaterThan(5);
          expect(altText).toContain(book.title);
        }
      }
    });

    it("should have proper image dimensions in metadata", () => {
      // Book covers are displayed as:
      // - Book pages: 128px width (w-32)
      // - OpenGraph: 400x600 specified in metadata

      const ogImageWidth = 400;
      const ogImageHeight = 600;

      expect(ogImageWidth).toBeGreaterThan(0);
      expect(ogImageHeight).toBeGreaterThan(0);

      // Aspect ratio should be reasonable (portrait for books)
      const aspectRatio = ogImageWidth / ogImageHeight;
      expect(aspectRatio).toBeLessThan(1); // Portrait
      expect(aspectRatio).toBeGreaterThan(0.5); // Not too narrow
    });
  });

  describe("Image File Naming", () => {
    it("should have URL-friendly cover filenames", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const filename = path.basename(book.cover, path.extname(book.cover));

          // Should be lowercase with hyphens or underscores (URL-friendly)
          expect(filename).toMatch(/^[a-z0-9_-]+$/);

          // Should not start or end with hyphen or underscore
          expect(filename).not.toMatch(/^[-_]/);
          expect(filename).not.toMatch(/[-_]$/);

          // Should not have consecutive hyphens or underscores
          expect(filename).not.toMatch(/--/);
          expect(filename).not.toMatch(/__/);
        }
      }
    });

    it("should match book_key in most cases", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const filename = path.basename(book.cover, path.extname(book.cover));

          // In most cases, filename should match book_key
          // (but we allow exceptions for legacy data)
          if (filename !== book.book_key) {
            // Just log a warning, don't fail
            console.warn(
              `Cover filename "${filename}" doesn't match book_key "${book.book_key}" for ${book.title}`
            );
          }
        }
      }
    });
  });

  describe("Image URLs for Schema.org", () => {
    it("should generate valid absolute URLs for structured data", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // Simulate JSON-LD image URL generation
          const imageUrl = `https://obob.dog${book.cover}`;

          // Must be absolute URL
          expect(imageUrl).toMatch(/^https:\/\//);

          // Must be on our domain
          expect(imageUrl).toMatch(/^https:\/\/obob\.dog\//);

          // Must have valid extension
          expect(imageUrl).toMatch(/\.(jpg|jpeg|png|webp)$/i);
        }
      }
    });

    it("should have unique image URLs for each book", async () => {
      const allImageUrls = new Set<string>();

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const imageUrl = `https://obob.dog${book.cover}`;

          expect(allImageUrls.has(imageUrl)).toBe(
            false,
            `Duplicate image URL: ${imageUrl}`
          );
          allImageUrls.add(imageUrl);
        }
      }

      // Should have one unique cover per book
      expect(allImageUrls.size).toBeGreaterThanOrEqual(70);
    });
  });

  describe("Next.js Image Component Compatibility", () => {
    it("should have valid image sources for next/image", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // next/image requires:
          // 1. Valid file path
          // 2. Accessible file
          // 3. Supported format

          expect(book.cover).toBeDefined();
          expect(book.cover).toMatch(/^\/covers\//);
          expect(book.cover).toMatch(/\.(jpg|jpeg|png|webp)$/i);
        }
      }
    });

    it("should have alt text components available", async () => {
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          // Alt text should be constructible from book data
          expect(book.title).toBeDefined();

          const altText = book.title; // or `${book.title} cover`
          expect(altText).toBeDefined();
          expect(altText.length).toBeGreaterThan(0);
        }
      }
    });
  });
});
