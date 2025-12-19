import { describe, it, expect } from 'vitest';
import {
  selectDistributedQuestions,
  normalizeAnswer,
  isSingleWordAnswer,
  filterCrosswordQuestions,
} from '@/lib/crossword/utils';
// Generator tests moved to crossword-generator.test.ts due to slow library
import type { CrosswordQuestion } from '@/lib/crossword/types';
import type { ContentQuestion, Book } from '@/types';

// Helper to create mock crossword questions
function createMockCrosswordQuestion(
  bookKey: string,
  answer: string,
  index: number
): CrosswordQuestion {
  return {
    text: `Question ${index} for ${bookKey}`,
    answer: answer.toUpperCase(),
    bookKey,
    bookTitle: `Book ${bookKey}`,
    page: index,
  };
}

// Helper to create a pool of crossword questions
function createCrosswordQuestionPool(
  bookKeys: string[],
  questionsPerBook: number
): CrosswordQuestion[] {
  const questions: CrosswordQuestion[] = [];
  let answerIndex = 0;

  for (const bookKey of bookKeys) {
    for (let i = 0; i < questionsPerBook; i++) {
      questions.push(
        createMockCrosswordQuestion(bookKey, `ANSWER${answerIndex}`, i)
      );
      answerIndex++;
    }
  }

  return questions;
}

describe('Crossword Utils', () => {
  describe('normalizeAnswer', () => {
    it('should uppercase the answer', () => {
      expect(normalizeAnswer('hello')).toBe('HELLO');
    });

    it('should remove parenthetical content', () => {
      expect(normalizeAnswer('answer (pg. 5)')).toBe('ANSWER');
      expect(normalizeAnswer('test (page 123)')).toBe('TEST');
    });

    it('should remove punctuation', () => {
      expect(normalizeAnswer("don't")).toBe('DONT');
      expect(normalizeAnswer('hello-world')).toBe('HELLOWORLD');
    });

    it('should remove numbers', () => {
      expect(normalizeAnswer('test123')).toBe('TEST');
    });

    it('should handle complex cases', () => {
      expect(normalizeAnswer("Mary's Book (pg. 42)")).toBe('MARYSBOOK');
    });
  });

  describe('isSingleWordAnswer', () => {
    it('should accept valid single words', () => {
      expect(isSingleWordAnswer('hello')).toBe(true);
      expect(isSingleWordAnswer('WORLD')).toBe(true);
      expect(isSingleWordAnswer('test')).toBe(true);
    });

    it('should reject answers with spaces', () => {
      expect(isSingleWordAnswer('hello world')).toBe(false);
      expect(isSingleWordAnswer('New York')).toBe(false);
    });

    it('should reject answers that are too short', () => {
      expect(isSingleWordAnswer('hi')).toBe(false);
      expect(isSingleWordAnswer('a')).toBe(false);
    });

    it('should reject answers that are too long', () => {
      expect(isSingleWordAnswer('supercalifragilisticexpialidocious')).toBe(false);
    });

    it('should accept answers with parenthetical notes', () => {
      // "hello (pg. 5)" normalizes to "HELLO" which is valid
      expect(isSingleWordAnswer('hello (pg. 5)')).toBe(true);
    });
  });

  describe('selectDistributedQuestions', () => {
    it('should select the correct number of questions', () => {
      const questions = createCrosswordQuestionPool(['book1', 'book2'], 10);
      const selected = selectDistributedQuestions(questions, 5);

      expect(selected).toHaveLength(5);
    });

    it('should distribute questions across books', () => {
      const questions = createCrosswordQuestionPool(['book1', 'book2', 'book3'], 10);
      const selected = selectDistributedQuestions(questions, 9);

      // Count questions per book
      const countsByBook = selected.reduce((acc, q) => {
        acc[q.bookKey] = (acc[q.bookKey] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Each book should have roughly equal representation
      const counts = Object.values(countsByBook);
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);
      expect(maxCount - minCount).toBeLessThanOrEqual(2);
    });

    it('should NOT return questions with duplicate answers', () => {
      // Create questions where some have the same answer
      const questions: CrosswordQuestion[] = [
        createMockCrosswordQuestion('book1', 'INDIANA', 1),
        createMockCrosswordQuestion('book2', 'INDIANA', 2), // Same answer!
        createMockCrosswordQuestion('book1', 'OHIO', 3),
        createMockCrosswordQuestion('book2', 'TEXAS', 4),
        createMockCrosswordQuestion('book3', 'INDIANA', 5), // Same answer again!
        createMockCrosswordQuestion('book3', 'FLORIDA', 6),
      ];

      const selected = selectDistributedQuestions(questions, 10);

      // Check that all answers are unique
      const answers = selected.map(q => q.answer);
      const uniqueAnswers = new Set(answers);
      expect(uniqueAnswers.size).toBe(answers.length);
    });

    it('should handle large pools with many duplicate answers', () => {
      // Create 30 questions but only 10 unique answers
      const questions: CrosswordQuestion[] = [];
      const uniqueAnswers = ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR', 'WOLF', 'FOX', 'OWL', 'BAT'];

      for (let i = 0; i < 30; i++) {
        const answer = uniqueAnswers[i % uniqueAnswers.length];
        const bookKey = `book${(i % 3) + 1}`;
        questions.push({
          text: `Question ${i} about ${answer}`,
          answer,
          bookKey,
          bookTitle: `Book ${bookKey}`,
          page: i,
        });
      }

      const selected = selectDistributedQuestions(questions, 20);

      // Should only get up to 10 questions (one per unique answer)
      expect(selected.length).toBeLessThanOrEqual(10);

      // All answers should be unique
      const selectedAnswers = selected.map(q => q.answer);
      const uniqueSelectedAnswers = new Set(selectedAnswers);
      expect(uniqueSelectedAnswers.size).toBe(selectedAnswers.length);
    });

    it('should not return empty array when valid questions exist', () => {
      const questions = createCrosswordQuestionPool(['book1'], 5);
      const selected = selectDistributedQuestions(questions, 3);

      expect(selected.length).toBeGreaterThan(0);
    });

    it('should handle empty question pool', () => {
      const questions: CrosswordQuestion[] = [];
      const selected = selectDistributedQuestions(questions, 5);

      expect(selected).toHaveLength(0);
    });
  });

  describe('filterCrosswordQuestions', () => {
    const mockBooks: Book[] = [
      { book_key: 'book1', title: 'Book One', author: 'Author 1', cover: '/cover1.jpg' },
      { book_key: 'book2', title: 'Book Two', author: 'Author 2', cover: '/cover2.jpg' },
    ];

    it('should only include content questions', () => {
      const questions = [
        { type: 'content' as const, book_key: 'book1', text: 'Q1', answer: 'ANSWER', page: 1 },
        { type: 'in-which-book' as const, book_key: 'book1', text: 'Q2', page: 2 },
      ];

      const filtered = filterCrosswordQuestions(questions, ['book1'], mockBooks);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].text).toBe('Q1');
    });

    it('should only include questions from selected books', () => {
      const questions: ContentQuestion[] = [
        { type: 'content', book_key: 'book1', text: 'Q1', answer: 'TEST', page: 1 },
        { type: 'content', book_key: 'book2', text: 'Q2', answer: 'WORD', page: 2 },
        { type: 'content', book_key: 'book3', text: 'Q3', answer: 'OTHER', page: 3 },
      ];

      const filtered = filterCrosswordQuestions(questions, ['book1', 'book2'], mockBooks);
      expect(filtered).toHaveLength(2);
    });

    it('should only include single-word answers', () => {
      const questions: ContentQuestion[] = [
        { type: 'content', book_key: 'book1', text: 'Q1', answer: 'SINGLE', page: 1 },
        { type: 'content', book_key: 'book1', text: 'Q2', answer: 'Two Words', page: 2 },
        { type: 'content', book_key: 'book1', text: 'Q3', answer: 'OK', page: 3 }, // Too short
      ];

      const filtered = filterCrosswordQuestions(questions, ['book1'], mockBooks);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].answer).toBe('SINGLE');
    });

    it('should normalize answers in the output', () => {
      const questions: ContentQuestion[] = [
        { type: 'content', book_key: 'book1', text: 'Q1', answer: 'hello', page: 1 },
      ];

      const filtered = filterCrosswordQuestions(questions, ['book1'], mockBooks);
      expect(filtered[0].answer).toBe('HELLO');
    });

    it('should include book title in output', () => {
      const questions: ContentQuestion[] = [
        { type: 'content', book_key: 'book1', text: 'Q1', answer: 'TEST', page: 1 },
      ];

      const filtered = filterCrosswordQuestions(questions, ['book1'], mockBooks);
      expect(filtered[0].bookTitle).toBe('Book One');
    });
  });
});
