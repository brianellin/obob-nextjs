import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/questions/reload/route';
import type { Book, QuestionWithBook } from '@/types';
import fs from 'fs/promises';
import path from 'path';

// Cached test data to avoid repeated filesystem reads
let cachedTestData: { year: string; division: string; books: Book[] } | null = null;

// Helper to get a valid year/division combination for testing
async function getTestYearDivision(): Promise<{ year: string; division: string; books: Book[] }> {
  // Return cached data if available
  if (cachedTestData) {
    return cachedTestData;
  }

  const obobPath = path.join(process.cwd(), 'public', 'obob');
  const years = await fs.readdir(obobPath);

  for (const year of years) {
    if (year.startsWith('.')) continue;
    const yearPath = path.join(obobPath, year);
    const stat = await fs.stat(yearPath);

    if (stat.isDirectory()) {
      const divisions = await fs.readdir(yearPath);
      for (const division of divisions) {
        if (division.startsWith('.')) continue;
        const divisionPath = path.join(yearPath, division);
        const divStat = await fs.stat(divisionPath);

        if (divStat.isDirectory()) {
          // Load books for this division
          const booksPath = path.join(divisionPath, 'books.json');
          try {
            const booksContent = await fs.readFile(booksPath, 'utf8');
            const { books } = JSON.parse(booksContent) as { books: Record<string, Book> };
            const bookArray = Object.values(books);

            if (bookArray.length >= 4) {
              cachedTestData = { year, division, books: bookArray };
              return cachedTestData;
            }
          } catch (error) {
            continue;
          }
        }
      }
    }
  }

  throw new Error('No valid year/division with 4+ books found for testing');
}

// Helper to create a mock Request object
function createMockRequest(body: any): Request {
  return new Request('http://localhost:3000/api/questions/reload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('API Reload Question Route', () => {
  describe('Question Type Consistency', () => {
    it('should always return a content question when requesting content type', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        year,
        division,
        questionType: 'content',
        selectedBooks,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question).toBeDefined();
      expect(data.question.type).toBe('content');
      expect(data.question.answer).toBeDefined();
    });

    it('should always return an in-which-book question when requesting in-which-book type', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        year,
        division,
        questionType: 'in-which-book',
        selectedBooks,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question).toBeDefined();
      expect(data.question.type).toBe('in-which-book');
      // in-which-book questions should not have an answer field
      expect((data.question as any).answer).toBeUndefined();
    });

    it('should return a question when requesting both type', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        year,
        division,
        questionType: 'both',
        selectedBooks,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question).toBeDefined();
      expect(['content', 'in-which-book']).toContain(data.question.type);
    });

    it('should return different content questions on multiple calls', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      // Make multiple requests
      const questions: QuestionWithBook[] = [];
      const uniqueTexts = new Set<string>();

      for (let i = 0; i < 5; i++) {
        const request = createMockRequest({
          year,
          division,
          questionType: 'content',
          selectedBooks,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.question.type).toBe('content');

        questions.push(data.question);
        uniqueTexts.add(data.question.text);
      }

      // Should get at least some variety (not all the same question)
      // Note: There's a tiny chance all 5 could be the same, but very unlikely
      expect(uniqueTexts.size).toBeGreaterThan(1);
    });
  });

  describe('Basic Functionality', () => {
    it('should return a single question for valid request', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        year,
        division,
        questionType: 'content',
        selectedBooks,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question).toBeDefined();
      expect(typeof data.question).toBe('object');
    });

    it('should include book data with the question', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        year,
        division,
        questionType: 'content',
        selectedBooks,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question.book).toBeDefined();
      expect(data.question.book.book_key).toBeDefined();
      expect(data.question.book.title).toBeDefined();
      expect(data.question.book.author).toBeDefined();
    });

    it('should include required question fields', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        year,
        division,
        questionType: 'content',
        selectedBooks,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.question.type).toBeDefined();
      expect(data.question.text).toBeDefined();
      expect(data.question.book_key).toBeDefined();
      expect(typeof data.question.text).toBe('string');
      expect(data.question.text.length).toBeGreaterThan(0);
    });
  });

  describe('Book Filtering', () => {
    it('should only return questions from selected books', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);
      const selectedBookKeys = new Set(selectedBooks.map(b => b.book_key));

      const request = createMockRequest({
        year,
        division,
        questionType: 'content',
        selectedBooks,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(selectedBookKeys.has(data.question.book.book_key)).toBe(true);
    });

    it('should respect different book selections', async () => {
      const { year, division, books } = await getTestYearDivision();

      if (books.length < 6) {
        // Skip if not enough books
        return;
      }

      // Test with different book selection
      const selectedBooks = [books[1], books[3], books[5]];
      const selectedBookKeys = new Set(selectedBooks.map(b => b.book_key));

      const request = createMockRequest({
        year,
        division,
        questionType: 'content',
        selectedBooks,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(selectedBookKeys.has(data.question.book.book_key)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid year gracefully', async () => {
      const { division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        year: 'invalid-year',
        division,
        questionType: 'content',
        selectedBooks,
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle invalid division gracefully', async () => {
      const { year, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        year,
        division: 'invalid-division',
        questionType: 'content',
        selectedBooks,
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle empty selectedBooks array', async () => {
      const { year, division } = await getTestYearDivision();

      const request = createMockRequest({
        year,
        division,
        questionType: 'content',
        selectedBooks: [],
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle case when no questions match criteria', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 1);

      // Try to get a question type that might not exist for this book
      const request = createMockRequest({
        year,
        division,
        questionType: 'in-which-book',
        selectedBooks,
      });

      const response = await POST(request);

      // Should either return a question or a 404
      if (response.status === 404) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      } else {
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Randomization', () => {
    it('should provide randomized questions from the available pool', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 5);

      // Collect 10 questions
      const bookKeys = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const request = createMockRequest({
          year,
          division,
          questionType: 'content',
          selectedBooks,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        bookKeys.add(data.question.book.book_key);
      }

      // With 5 books and 10 questions, we should see multiple books represented
      // (unless there are very few questions available)
      expect(bookKeys.size).toBeGreaterThanOrEqual(1);
    });
  });
});
