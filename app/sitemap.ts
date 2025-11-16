import { MetadataRoute } from "next";
import fs from "fs/promises";
import path from "path";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://obob.dog";

  const yearDivisions = [
    { year: "2024-2025", division: "3-5" },
    { year: "2024-2025", division: "6-8" },
    { year: "2025-2026", division: "3-5" },
    { year: "2025-2026", division: "6-8" },
    { year: "2025-2026", division: "9-12" },
  ];

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/battle`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Add division pages
  for (const { year, division } of yearDivisions) {
    sitemap.push({
      url: `${baseUrl}/books/${year}/${division}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });

    // Add battle division pages
    sitemap.push({
      url: `${baseUrl}/battle/${year}/${division}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  // Add all book pages
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
        sitemap.push({
          url: `${baseUrl}/books/${year}/${division}/${book_key}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    } catch (error) {
      console.error(`Error loading books for ${year}/${division}:`, error);
    }
  }

  return sitemap;
}
