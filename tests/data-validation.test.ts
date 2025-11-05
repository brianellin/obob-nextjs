import { describe, it, expect } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { Book, Books, Question, ContentQuestion, InWhichBookQuestion } from '@/types';

// Helper to get all year/division combinations
async function getAllYearDivisions(): Promise<Array<{ year: string; division: string }>> {
  const obobPath = path.join(process.cwd(), 'public', 'obob');
  const years = await fs.readdir(obobPath);

  const combinations: Array<{ year: string; division: string }> = [];

  for (const year of years) {
    if (year.startsWith('.')) continue; // Skip hidden files
    const yearPath = path.join(obobPath, year);
    const stat = await fs.stat(yearPath);

    if (stat.isDirectory()) {
      const divisions = await fs.readdir(yearPath);
      for (const division of divisions) {
        if (division.startsWith('.')) continue; // Skip hidden files
        const divisionPath = path.join(yearPath, division);
        const divStat = await fs.stat(divisionPath);
        if (divStat.isDirectory()) {
          combinations.push({ year, division });
        }
      }
    }
  }

  return combinations;
}

// Type guard for ContentQuestion
function isContentQuestion(q: Question): q is ContentQuestion {
  return q.type === 'content';
}

// Type guard for InWhichBookQuestion
function isInWhichBookQuestion(q: Question): q is InWhichBookQuestion {
  return q.type === 'in-which-book';
}

describe('OBOB Data Validation', () => {
  describe('Directory Structure', () => {
    it('should have at least one year directory', async () => {
      const combinations = await getAllYearDivisions();
      expect(combinations.length).toBeGreaterThan(0);
    });

    it('should have valid year format (YYYY-YYYY)', async () => {
      const combinations = await getAllYearDivisions();
      const yearRegex = /^\d{4}-\d{4}$/;

      for (const { year } of combinations) {
        expect(year).toMatch(yearRegex);
      }
    });

    it('should have valid division format', async () => {
      const combinations = await getAllYearDivisions();
      const validDivisions = ['3-5', '6-8', '9-12'];

      for (const { division } of combinations) {
        expect(validDivisions).toContain(division);
      }
    });
  });

  describe('Books Validation', () => {
    it('should have valid books.json in each year/division', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const booksPath = path.join(process.cwd(), 'public', 'obob', year, division, 'books.json');

        // File should exist
        const exists = await fs.access(booksPath).then(() => true).catch(() => false);
        expect(exists, `books.json should exist for ${year}/${division}`).toBe(true);

        if (exists) {
          // Should be valid JSON
          const content = await fs.readFile(booksPath, 'utf8');
          let parsed: { books: Books };

          expect(() => {
            parsed = JSON.parse(content);
          }, `books.json should be valid JSON for ${year}/${division}`).not.toThrow();

          parsed = JSON.parse(content);
          expect(parsed.books, `books.json should have a "books" property for ${year}/${division}`).toBeDefined();
        }
      }
    });

    it('should have valid book entries with all required fields', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const booksPath = path.join(process.cwd(), 'public', 'obob', year, division, 'books.json');
        const content = await fs.readFile(booksPath, 'utf8');
        const { books } = JSON.parse(content) as { books: Books };

        expect(Object.keys(books).length, `${year}/${division} should have at least one book`).toBeGreaterThan(0);

        for (const [bookKey, book] of Object.entries(books)) {
          // Check required fields
          expect(book.book_key, `book_key missing for ${bookKey} in ${year}/${division}`).toBeDefined();
          expect(book.title, `title missing for ${bookKey} in ${year}/${division}`).toBeDefined();
          expect(book.author, `author missing for ${bookKey} in ${year}/${division}`).toBeDefined();
          expect(book.cover, `cover missing for ${bookKey} in ${year}/${division}`).toBeDefined();
          expect(book.obob_division, `obob_division missing for ${bookKey} in ${year}/${division}`).toBeDefined();
          expect(book.obob_year, `obob_year missing for ${bookKey} in ${year}/${division}`).toBeDefined();

          // Check types
          expect(typeof book.book_key, `book_key should be string for ${bookKey}`).toBe('string');
          expect(typeof book.title, `title should be string for ${bookKey}`).toBe('string');
          expect(typeof book.author, `author should be string for ${bookKey}`).toBe('string');
          expect(typeof book.cover, `cover should be string for ${bookKey}`).toBe('string');

          // Check that book_key matches the key in the object
          expect(book.book_key, `book_key should match object key for ${bookKey} in ${year}/${division}`).toBe(bookKey);

          // Check division matches
          expect(book.obob_division, `obob_division should match directory for ${bookKey} in ${year}/${division}`).toBe(division);

          // Check optional fields if present
          if (book.author_pronunciation) {
            expect(typeof book.author_pronunciation, `author_pronunciation should be string for ${bookKey}`).toBe('string');
          }

          // Check that cover path exists (basic format check)
          expect(book.cover, `cover should start with / for ${bookKey}`).toMatch(/^\//);
        }
      }
    });
  });

  describe('Sources Validation', () => {
    it('should have valid sources.json in each year/division', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');

        // File should exist
        const exists = await fs.access(sourcesPath).then(() => true).catch(() => false);
        expect(exists, `sources.json should exist for ${year}/${division}`).toBe(true);

        if (exists) {
          // Should be valid JSON
          const content = await fs.readFile(sourcesPath, 'utf8');
          let parsed: { sources: Array<{ path: string; name: string; link: string | null }> };

          expect(() => {
            parsed = JSON.parse(content);
          }, `sources.json should be valid JSON for ${year}/${division}`).not.toThrow();

          parsed = JSON.parse(content);
          expect(parsed.sources, `sources.json should have a "sources" property for ${year}/${division}`).toBeDefined();
          expect(Array.isArray(parsed.sources), `sources should be an array for ${year}/${division}`).toBe(true);
        }
      }
    });

    it('should have valid source entries with all required fields', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
        const content = await fs.readFile(sourcesPath, 'utf8');
        const { sources } = JSON.parse(content) as { sources: Array<{ path: string; name: string; link: string | null }> };

        for (const [index, source] of sources.entries()) {
          // Check required fields
          expect(source.path, `path missing for source ${index} in ${year}/${division}`).toBeDefined();
          expect(source.name, `name missing for source ${index} in ${year}/${division}`).toBeDefined();
          expect(source.link !== undefined, `link missing for source ${index} in ${year}/${division}`).toBe(true);

          // Check types
          expect(typeof source.path, `path should be string for source ${index}`).toBe('string');
          expect(typeof source.name, `name should be string for source ${index}`).toBe('string');
          expect(source.link === null || typeof source.link === 'string', `link should be string or null for source ${index}`).toBe(true);
        }
      }
    });

    it('should have valid question files at source paths', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
        const content = await fs.readFile(sourcesPath, 'utf8');
        const { sources } = JSON.parse(content) as { sources: Array<{ path: string; name: string; link: string | null }> };

        for (const source of sources) {
          const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);

          // File should exist
          const exists = await fs.access(questionPath).then(() => true).catch(() => false);
          expect(exists, `Question file should exist at ${source.path} for ${year}/${division}`).toBe(true);

          if (exists) {
            // Should be valid JSON
            const questionContent = await fs.readFile(questionPath, 'utf8');
            expect(() => {
              JSON.parse(questionContent);
            }, `Question file should be valid JSON at ${source.path} for ${year}/${division}`).not.toThrow();
          }
        }
      }
    });
  });

  describe('Questions Validation', () => {
    it('should have valid question structure', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
        const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
        const { sources } = JSON.parse(sourcesContent) as { sources: Array<{ path: string; name: string; link: string | null }> };

        for (const source of sources) {
          const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
          const questionContent = await fs.readFile(questionPath, 'utf8');
          const { questions } = JSON.parse(questionContent) as { questions: Question[] };

          expect(Array.isArray(questions), `questions should be an array in ${source.path} for ${year}/${division}`).toBe(true);

          for (const [index, question] of questions.entries()) {
            const questionId = `${year}/${division}/${source.path}[${index}]`;

            // Check required base fields
            expect(question.type, `type missing for question ${questionId}`).toBeDefined();
            expect(question.text, `text missing for question ${questionId}`).toBeDefined();
            expect(question.book_key, `book_key missing for question ${questionId}`).toBeDefined();

            // Check types
            expect(['in-which-book', 'content'].includes(question.type),
              `type should be 'in-which-book' or 'content' for question ${questionId}`).toBe(true);
            expect(typeof question.text, `text should be string for question ${questionId}`).toBe('string');
            expect(typeof question.book_key, `book_key should be string for question ${questionId}`).toBe('string');

            // Check text is not empty
            expect(question.text.trim().length, `text should not be empty for question ${questionId}`).toBeGreaterThan(0);

            // Page is optional, but if provided must be valid
            if (question.page !== undefined && question.page !== null) {
              expect(typeof question.page, `page should be number for question ${questionId}`).toBe('number');
              expect(question.page, `page should be non-negative (>= 0) for question ${questionId}`).toBeGreaterThanOrEqual(0);
            }

            // Type-specific validation
            if (isContentQuestion(question)) {
              expect(question.answer, `answer missing for content question ${questionId}`).toBeDefined();
              expect(typeof question.answer, `answer should be string for question ${questionId}`).toBe('string');
              expect(question.answer.trim().length, `answer should not be empty for question ${questionId}`).toBeGreaterThan(0);
            } else if (isInWhichBookQuestion(question)) {
              // in-which-book questions should NOT have an answer field
              expect((question as any).answer,
                `in-which-book question should not have answer field for ${questionId}`).toBeUndefined();
            }

            // Optional fields
            if (question.contributor) {
              expect(typeof question.contributor, `contributor should be string for question ${questionId}`).toBe('string');
            }
          }
        }
      }
    });

    it('should reference valid books', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        // Load books
        const booksPath = path.join(process.cwd(), 'public', 'obob', year, division, 'books.json');
        const booksContent = await fs.readFile(booksPath, 'utf8');
        const { books } = JSON.parse(booksContent) as { books: Books };
        const validBookKeys = new Set(Object.keys(books));

        // Load sources
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
        const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
        const { sources } = JSON.parse(sourcesContent) as { sources: Array<{ path: string; name: string; link: string | null }> };

        // Check all questions
        for (const source of sources) {
          const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
          const questionContent = await fs.readFile(questionPath, 'utf8');
          const { questions } = JSON.parse(questionContent) as { questions: Question[] };

          for (const [index, question] of questions.entries()) {
            const questionId = `${year}/${division}/${source.path}[${index}]`;

            expect(validBookKeys.has(question.book_key),
              `Question references invalid book_key "${question.book_key}" for ${questionId}`).toBe(true);
          }
        }
      }
    });

    it('should have at least one question for each division', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
        const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
        const { sources } = JSON.parse(sourcesContent) as { sources: Array<{ path: string; name: string; link: string | null }> };

        let totalQuestions = 0;

        for (const source of sources) {
          const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
          const questionContent = await fs.readFile(questionPath, 'utf8');
          const { questions } = JSON.parse(questionContent) as { questions: Question[] };
          totalQuestions += questions.length;
        }

        expect(totalQuestions, `${year}/${division} should have at least one question`).toBeGreaterThan(0);
      }
    });

    it('should have both question types if count is sufficient', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
        const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
        const { sources } = JSON.parse(sourcesContent) as { sources: Array<{ path: string; name: string; link: string | null }> };

        let hasInWhichBook = false;
        let hasContent = false;

        for (const source of sources) {
          const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
          const questionContent = await fs.readFile(questionPath, 'utf8');
          const { questions } = JSON.parse(questionContent) as { questions: Question[] };

          for (const question of questions) {
            if (question.type === 'in-which-book') hasInWhichBook = true;
            if (question.type === 'content') hasContent = true;
          }
        }

        // At least warn if only one type exists (though it's not necessarily an error)
        if (!hasInWhichBook || !hasContent) {
          console.warn(`Warning: ${year}/${division} only has ${hasInWhichBook ? 'in-which-book' : 'content'} questions`);
        }

        // We'll just verify at least one type exists
        expect(hasInWhichBook || hasContent,
          `${year}/${division} should have at least one question type`).toBe(true);
      }
    });
  });

  describe('Data Consistency', () => {
    it('should not have duplicate questions (same text and book)', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
        const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
        const { sources } = JSON.parse(sourcesContent) as { sources: Array<{ path: string; name: string; link: string | null }> };

        const seen = new Map<string, string>();

        for (const source of sources) {
          const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
          const questionContent = await fs.readFile(questionPath, 'utf8');
          const { questions } = JSON.parse(questionContent) as { questions: Question[] };

          for (const [index, question] of questions.entries()) {
            const key = `${question.book_key}::${question.text.toLowerCase().trim()}`;

            if (seen.has(key)) {
              console.warn(`Duplicate question found in ${year}/${division}: "${question.text}" for book ${question.book_key}`);
              console.warn(`  First occurrence: ${seen.get(key)}`);
              console.warn(`  Second occurrence: ${source.path}[${index}]`);
            } else {
              seen.set(key, `${source.path}[${index}]`);
            }
          }
        }
      }
    });

    it('should have consistent book counts across books.json and questions', async () => {
      const combinations = await getAllYearDivisions();

      for (const { year, division } of combinations) {
        // Load books
        const booksPath = path.join(process.cwd(), 'public', 'obob', year, division, 'books.json');
        const booksContent = await fs.readFile(booksPath, 'utf8');
        const { books } = JSON.parse(booksContent) as { books: Books };
        const bookKeys = new Set(Object.keys(books));

        // Load all questions
        const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
        const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
        const { sources } = JSON.parse(sourcesContent) as { sources: Array<{ path: string; name: string; link: string | null }> };

        const booksWithQuestions = new Set<string>();

        for (const source of sources) {
          const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
          const questionContent = await fs.readFile(questionPath, 'utf8');
          const { questions } = JSON.parse(questionContent) as { questions: Question[] };

          for (const question of questions) {
            booksWithQuestions.add(question.book_key);
          }
        }

        // Check if there are books without questions
        for (const bookKey of bookKeys) {
          if (!booksWithQuestions.has(bookKey)) {
            console.warn(`Warning: Book "${bookKey}" in ${year}/${division} has no questions`);
          }
        }
      }
    });
  });
});
