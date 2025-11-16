import { describe, it, expect } from "vitest";
import { getBooksWithStats } from "@/lib/books";
import sitemap from "@/app/sitemap";

/**
 * SEO Sitemap Validation Tests
 *
 * These tests ensure the sitemap.xml includes all important pages
 * and follows SEO best practices for priorities and change frequencies.
 */

describe("Sitemap", () => {
  const yearDivisions = [
    { year: "2024-2025", division: "3-5" },
    { year: "2024-2025", division: "6-8" },
    { year: "2025-2026", division: "3-5" },
    { year: "2025-2026", division: "6-8" },
    { year: "2025-2026", division: "9-12" },
  ];

  describe("Core Pages", () => {
    it("should include home page with highest priority", async () => {
      const sitemapData = await sitemap();

      const homePage = sitemapData.find((item) => item.url === "https://obob.dog");
      expect(homePage).toBeDefined();
      expect(homePage?.priority).toBe(1.0);
      expect(homePage?.changeFrequency).toBe("daily");
    });

    it("should include main books page", async () => {
      const sitemapData = await sitemap();

      const booksPage = sitemapData.find(
        (item) => item.url === "https://obob.dog/books"
      );
      expect(booksPage).toBeDefined();
      expect(booksPage?.priority).toBeGreaterThanOrEqual(0.8);
    });

    it("should include battle page", async () => {
      const sitemapData = await sitemap();

      const battlePage = sitemapData.find(
        (item) => item.url === "https://obob.dog/battle"
      );
      expect(battlePage).toBeDefined();
      expect(battlePage?.priority).toBeGreaterThanOrEqual(0.8);
    });

    it("should include about page", async () => {
      const sitemapData = await sitemap();

      const aboutPage = sitemapData.find(
        (item) => item.url === "https://obob.dog/about"
      );
      expect(aboutPage).toBeDefined();
    });
  });

  describe("Division Pages", () => {
    it("should include all division pages", async () => {
      const sitemapData = await sitemap();

      for (const { year, division } of yearDivisions) {
        const divisionUrl = `https://obob.dog/books/${year}/${division}`;
        const divisionPage = sitemapData.find((item) => item.url === divisionUrl);

        expect(divisionPage).toBeDefined();
        expect(divisionPage?.priority).toBeGreaterThanOrEqual(0.6);
      }
    });

    it("should include battle division pages", async () => {
      const sitemapData = await sitemap();

      for (const { year, division } of yearDivisions) {
        const battleDivisionUrl = `https://obob.dog/battle/${year}/${division}`;
        const battlePage = sitemapData.find(
          (item) => item.url === battleDivisionUrl
        );

        expect(battlePage).toBeDefined();
      }
    });
  });

  describe("Book Pages", () => {
    it("should include all book pages", async () => {
      const sitemapData = await sitemap();

      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);

        for (const { book } of booksStats) {
          const bookUrl = `https://obob.dog/books/${year}/${division}/${book.book_key}`;
          const bookPage = sitemapData.find((item) => item.url === bookUrl);

          expect(bookPage).toBeDefined();
          expect(bookPage?.priority).toBe(0.8);
        }
      }
    });

    it("should have at least 70 book pages in sitemap", async () => {
      const sitemapData = await sitemap();

      const bookPages = sitemapData.filter((item) =>
        item.url.match(/\/books\/\d{4}-\d{4}\/[3-9]-[0-9]{1,2}\/[a-z0-9-]+$/)
      );

      // 2024-2025: 32 books, 2025-2026: 44 books = 76 total
      expect(bookPages.length).toBeGreaterThanOrEqual(70);
    });
  });

  describe("URL Format", () => {
    it("should use absolute URLs starting with https://obob.dog", async () => {
      const sitemapData = await sitemap();

      for (const item of sitemapData) {
        expect(item.url).toMatch(/^https:\/\/obob\.dog/);
      }
    });

    it("should not have trailing slashes", async () => {
      const sitemapData = await sitemap();

      for (const item of sitemapData) {
        // Only root domain can have trailing slash
        if (item.url !== "https://obob.dog") {
          expect(item.url).not.toMatch(/\/$/);
        }
      }
    });

    it("should not have duplicate URLs", async () => {
      const sitemapData = await sitemap();

      const urls = sitemapData.map((item) => item.url);
      const uniqueUrls = new Set(urls);

      expect(urls.length).toBe(
        uniqueUrls.size,
        "Sitemap contains duplicate URLs"
      );
    });
  });

  describe("Priority Values", () => {
    it("should have priorities between 0 and 1", async () => {
      const sitemapData = await sitemap();

      for (const item of sitemapData) {
        if (item.priority !== undefined) {
          expect(item.priority).toBeGreaterThanOrEqual(0);
          expect(item.priority).toBeLessThanOrEqual(1);
        }
      }
    });

    it("should use appropriate priorities for different page types", async () => {
      const sitemapData = await sitemap();

      // Home should have highest priority
      const home = sitemapData.find((item) => item.url === "https://obob.dog");
      expect(home?.priority).toBe(1.0);

      // Book pages should have high priority (they're main content)
      const bookPages = sitemapData.filter((item) =>
        item.url.match(/\/books\/\d{4}-\d{4}\/[3-9]-[0-9]{1,2}\/[a-z0-9-]+$/)
      );
      for (const page of bookPages) {
        expect(page.priority).toBe(0.8);
      }

      // Division pages should have medium-high priority
      const divisionPages = sitemapData.filter(
        (item) =>
          item.url.match(/\/books\/\d{4}-\d{4}\/[3-9]-[0-9]{1,2}$/) &&
          !item.url.includes("/battle/")
      );
      for (const page of divisionPages) {
        expect(page.priority).toBeGreaterThanOrEqual(0.7);
      }
    });
  });

  describe("Change Frequency", () => {
    it("should have valid changeFrequency values", async () => {
      const sitemapData = await sitemap();

      const validFrequencies = [
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ];

      for (const item of sitemapData) {
        if (item.changeFrequency !== undefined) {
          expect(validFrequencies).toContain(item.changeFrequency);
        }
      }
    });

    it("should use appropriate changeFrequency for content", async () => {
      const sitemapData = await sitemap();

      // Home page changes frequently
      const home = sitemapData.find((item) => item.url === "https://obob.dog");
      expect(home?.changeFrequency).toBe("daily");

      // About page changes rarely
      const about = sitemapData.find(
        (item) => item.url === "https://obob.dog/about"
      );
      expect(about?.changeFrequency).toBe("monthly");

      // Book pages change occasionally
      const bookPages = sitemapData.filter((item) =>
        item.url.match(/\/books\/\d{4}-\d{4}\/[3-9]-[0-9]{1,2}\/[a-z0-9-]+$/)
      );
      for (const page of bookPages) {
        expect(page.changeFrequency).toBe("weekly");
      }
    });
  });

  describe("Last Modified Dates", () => {
    it("should have lastModified dates", async () => {
      const sitemapData = await sitemap();

      for (const item of sitemapData) {
        expect(item.lastModified).toBeDefined();
        expect(item.lastModified).toBeInstanceOf(Date);
      }
    });

    it("should have valid date values", async () => {
      const sitemapData = await sitemap();

      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);

      for (const item of sitemapData) {
        const lastMod = item.lastModified;
        if (lastMod) {
          expect(lastMod.getTime()).toBeLessThanOrEqual(now.getTime());
          expect(lastMod.getTime()).toBeGreaterThan(oneYearAgo.getTime());
        }
      }
    });
  });

  describe("Completeness", () => {
    it("should have a reasonable total number of URLs", async () => {
      const sitemapData = await sitemap();

      // Expected URLs:
      // - 4 core pages (home, books, battle, about)
      // - 5 division book pages
      // - 5 battle division pages
      // - 76+ book pages
      // Total: ~90+ URLs

      expect(sitemapData.length).toBeGreaterThanOrEqual(85);
      expect(sitemapData.length).toBeLessThan(200); // Sanity check
    });

    it("should match the number of books with generateStaticParams", async () => {
      // Count total books across all divisions
      let totalBooks = 0;
      for (const { year, division } of yearDivisions) {
        const booksStats = await getBooksWithStats(year, division);
        totalBooks += booksStats.length;
      }

      const sitemapData = await sitemap();
      const bookUrls = sitemapData.filter((item) =>
        item.url.match(/\/books\/\d{4}-\d{4}\/[3-9]-[0-9]{1,2}\/[a-z0-9-]+$/)
      );

      expect(bookUrls.length).toBe(totalBooks);
    });
  });
});
