import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/questions/battle/route';
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
          } catch {
            continue;
          }
        }
      }
    }
  }

  throw new Error('No valid year/division with 4+ books found for testing');
}

// Helper to create a mock Request object
function createMockRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost:3000/api/questions/battle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('API Battle Questions Route', () => {
  describe('Basic Functionality', () => {
    it('should return questions for valid request', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'both',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toBeDefined();
      expect(Array.isArray(data.questions)).toBe(true);
      expect(data.questions.length).toBeGreaterThan(0);
    });

    it('should return correct number of questions', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 5);
      const questionCount = 10;

      const request = createMockRequest({
        selectedBooks,
        questionCount,
        questionType: 'content',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should return the requested count or less if not enough questions
      expect(data.questions.length).toBeLessThanOrEqual(questionCount);
    });

    it('should include book data with each question', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        selectedBooks,
        questionCount: 4,
        questionType: 'content',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Each question should have book data
      data.questions.forEach((question: QuestionWithBook) => {
        expect(question.book).toBeDefined();
        expect(question.book.book_key).toBeDefined();
        expect(question.book.title).toBeDefined();
        expect(question.book.author).toBeDefined();
      });
    });
  });

  describe('Question Type Handling', () => {
    it('should return only content questions when type is content', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'content',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // All questions should be content type
      data.questions.forEach((question: QuestionWithBook) => {
        expect(question.type).toBe('content');
        expect(question.answer).toBeDefined();
      });
    });

    it('should return only in-which-book questions when type is in-which-book', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'in-which-book',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // All questions should be in-which-book type
      data.questions.forEach((question: QuestionWithBook) => {
        expect(question.type).toBe('in-which-book');
        // in-which-book questions should not have an answer field
        expect('answer' in question ? question.answer : undefined).toBeUndefined();
      });
    });

    it('should return mixed questions when type is both', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        selectedBooks,
        questionCount: 10,
        questionType: 'both',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Should have both types (if both are available)
      const types = new Set(data.questions.map((q: QuestionWithBook) => q.type));

      // If we have enough questions, should have both types
      if (data.questions.length >= 6) {
        expect(types.size).toBeGreaterThan(1);
      }
    });
  });

  describe('Minimum Books Requirement for In-Which-Book Questions', () => {
    it('should enforce minimum 4 books for in-which-book questions', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 3); // Only 3 books

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'in-which-book',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
      expect(data.message).toContain('at least 4 books');

      // Should return content questions instead
      data.questions.forEach((question: QuestionWithBook) => {
        expect(question.type).toBe('content');
      });
    });

    it('should enforce minimum 4 books for both question type', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 2); // Only 2 books

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'both',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBeDefined();
      expect(data.message).toContain('at least 4 books');

      // Should return only content questions
      data.questions.forEach((question: QuestionWithBook) => {
        expect(question.type).toBe('content');
      });
    });

    it('should allow in-which-book questions with 4 or more books', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4); // Exactly 4 books

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'in-which-book',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBeUndefined(); // No warning message

      // Should return in-which-book questions
      if (data.questions.length > 0) {
        expect(data.questions.some((q: QuestionWithBook) => q.type === 'in-which-book')).toBe(true);
      }
    });

    it('should not enforce minimum for content-only questions', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 2); // Only 2 books

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'content',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBeUndefined(); // No warning message

      // Should return content questions
      data.questions.forEach((question: QuestionWithBook) => {
        expect(question.type).toBe('content');
      });
    });
  });

  describe('Book Filtering', () => {
    it('should only return questions from selected books', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);
      const selectedBookKeys = new Set(selectedBooks.map(b => b.book_key));

      const request = createMockRequest({
        selectedBooks,
        questionCount: 10,
        questionType: 'content',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // All questions should be from selected books
      data.questions.forEach((question: QuestionWithBook) => {
        expect(selectedBookKeys.has(question.book.book_key)).toBe(true);
      });
    });

    it('should handle different book selections', async () => {
      const { year, division, books } = await getTestYearDivision();

      if (books.length < 6) {
        // Skip if not enough books
        return;
      }

      // Test with different book selection
      const selectedBooks = [books[1], books[3], books[5], books[0]];
      const selectedBookKeys = new Set(selectedBooks.map(b => b.book_key));

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'content',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // All questions should be from the specifically selected books
      data.questions.forEach((question: QuestionWithBook) => {
        expect(selectedBookKeys.has(question.book.book_key)).toBe(true);
      });
    });
  });

  describe('Default Values', () => {
    it('should use default questionCount of 16 if not provided', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 5);

      const request = createMockRequest({
        selectedBooks,
        questionType: 'content',
        year,
        division,
        // questionCount omitted
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toBeDefined();
      // Should attempt to return 16 questions (or less if not enough available)
      expect(data.questions.length).toBeGreaterThan(0);
    });

    it('should use default questionType of "both" if not provided', async () => {
      const { year, division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 5);

      const request = createMockRequest({
        selectedBooks,
        questionCount: 10,
        year,
        division,
        // questionType omitted
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid year gracefully', async () => {
      const { division, books } = await getTestYearDivision();
      const selectedBooks = books.slice(0, 4);

      const request = createMockRequest({
        selectedBooks,
        questionCount: 8,
        questionType: 'content',
        year: 'invalid-year',
        division,
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
        selectedBooks,
        questionCount: 8,
        questionType: 'content',
        year,
        division: 'invalid-division',
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle empty selectedBooks array', async () => {
      const { year, division } = await getTestYearDivision();

      const request = createMockRequest({
        selectedBooks: [],
        questionCount: 8,
        questionType: 'content',
        year,
        division,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questions).toHaveLength(0);
    });
  });
});
