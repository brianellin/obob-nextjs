import { describe, it, expect } from 'vitest';
import {
  createSeededRandom,
  seededShuffle,
  seededSelectDistributed,
} from '@/lib/daily-crossword/seeded-random';

// Helper to create mock questions
function createMockQuestion(bookKey: string, answer: string, index: number) {
  return {
    text: `Question ${index} for ${bookKey}`,
    answer: answer.toUpperCase(),
    bookKey,
    bookTitle: `Book ${bookKey}`,
    page: index,
  };
}

// Helper to create a pool of questions
function createQuestionPool(
  bookKeys: string[],
  questionsPerBook: number
): Array<{ bookKey: string; answer: string; text: string; bookTitle: string; page: number }> {
  const questions: Array<{ bookKey: string; answer: string; text: string; bookTitle: string; page: number }> = [];
  let answerIndex = 0;

  for (const bookKey of bookKeys) {
    for (let i = 0; i < questionsPerBook; i++) {
      questions.push(createMockQuestion(bookKey, `ANSWER${answerIndex}`, i));
      answerIndex++;
    }
  }

  return questions;
}

describe('Seeded Random', () => {
  describe('createSeededRandom', () => {
    it('should produce deterministic results with the same seed', () => {
      const random1 = createSeededRandom('test-seed-123');
      const random2 = createSeededRandom('test-seed-123');

      const results1 = [random1(), random1(), random1(), random1(), random1()];
      const results2 = [random2(), random2(), random2(), random2(), random2()];

      expect(results1).toEqual(results2);
    });

    it('should produce different results with different seeds', () => {
      const random1 = createSeededRandom('seed-a');
      const random2 = createSeededRandom('seed-b');

      const results1 = [random1(), random1(), random1()];
      const results2 = [random2(), random2(), random2()];

      expect(results1).not.toEqual(results2);
    });

    it('should produce values between 0 and 1', () => {
      const random = createSeededRandom('bounds-test');

      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('seededShuffle', () => {
    it('should produce deterministic shuffle with same seed', () => {
      const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

      const random1 = createSeededRandom('shuffle-seed');
      const random2 = createSeededRandom('shuffle-seed');

      const shuffled1 = seededShuffle([...items], random1);
      const shuffled2 = seededShuffle([...items], random2);

      expect(shuffled1).toEqual(shuffled2);
    });

    it('should contain all original items', () => {
      const items = [1, 2, 3, 4, 5];
      const random = createSeededRandom('test');
      const shuffled = seededShuffle(items, random);

      expect(shuffled).toHaveLength(items.length);
      expect(shuffled.sort()).toEqual(items.sort());
    });
  });

  describe('seededSelectDistributed', () => {
    it('should select the correct number of questions', () => {
      const questions = createQuestionPool(['book1', 'book2'], 10);
      const random = createSeededRandom('test-seed');
      const selected = seededSelectDistributed(questions, 5, random);

      expect(selected).toHaveLength(5);
    });

    it('should produce deterministic results with same seed', () => {
      const questions = createQuestionPool(['book1', 'book2', 'book3'], 10);

      const random1 = createSeededRandom('deterministic-test');
      const random2 = createSeededRandom('deterministic-test');

      const selected1 = seededSelectDistributed(questions, 9, random1);
      const selected2 = seededSelectDistributed(questions, 9, random2);

      expect(selected1.map((q) => q.answer)).toEqual(selected2.map((q) => q.answer));
    });

    it('should distribute questions evenly across books', () => {
      const questions = createQuestionPool(['book1', 'book2', 'book3'], 10);
      const random = createSeededRandom('distribution-test');
      const selected = seededSelectDistributed(questions, 9, random);

      // Count questions per book
      const countsByBook = selected.reduce(
        (acc, q) => {
          acc[q.bookKey] = (acc[q.bookKey] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Each book should have exactly 3 questions (9 / 3 books)
      expect(countsByBook['book1']).toBe(3);
      expect(countsByBook['book2']).toBe(3);
      expect(countsByBook['book3']).toBe(3);
    });

    it('should NOT return questions with duplicate answers', () => {
      // Create questions where some have the same answer
      const questions = [
        createMockQuestion('book1', 'INDIANA', 1),
        createMockQuestion('book2', 'INDIANA', 2), // Same answer!
        createMockQuestion('book1', 'OHIO', 3),
        createMockQuestion('book2', 'TEXAS', 4),
        createMockQuestion('book3', 'INDIANA', 5), // Same answer again!
        createMockQuestion('book3', 'FLORIDA', 6),
      ];

      const random = createSeededRandom('dedup-test');
      const selected = seededSelectDistributed(questions, 10, random);

      // Check that all answers are unique
      const answers = selected.map((q) => q.answer);
      const uniqueAnswers = new Set(answers);
      expect(uniqueAnswers.size).toBe(answers.length);
    });

    it('should handle large pools with many duplicate answers', () => {
      // Create 30 questions but only 10 unique answers
      const uniqueAnswers = ['CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR', 'WOLF', 'FOX', 'OWL', 'BAT'];
      const questions: Array<{ bookKey: string; answer: string; text: string; bookTitle: string; page: number }> = [];

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

      const random = createSeededRandom('large-pool-test');
      const selected = seededSelectDistributed(questions, 20, random);

      // Should only get up to 10 questions (one per unique answer)
      expect(selected.length).toBeLessThanOrEqual(10);

      // All answers should be unique
      const selectedAnswers = selected.map((q) => q.answer);
      const uniqueSelectedAnswers = new Set(selectedAnswers);
      expect(uniqueSelectedAnswers.size).toBe(selectedAnswers.length);
    });

    it('should handle empty question pool', () => {
      const random = createSeededRandom('empty-test');
      const selected = seededSelectDistributed([], 5, random);

      expect(selected).toHaveLength(0);
    });

    it('should handle zero target count', () => {
      const questions = createQuestionPool(['book1'], 5);
      const random = createSeededRandom('zero-test');
      const selected = seededSelectDistributed(questions, 0, random);

      expect(selected).toHaveLength(0);
    });

    it('should handle case where requested count exceeds available unique answers', () => {
      // Only 6 unique answers across 2 books
      const questions = createQuestionPool(['book1', 'book2'], 3);
      const random = createSeededRandom('exceed-test');
      const selected = seededSelectDistributed(questions, 20, random);

      // Should get all 6 unique questions
      expect(selected).toHaveLength(6);

      // Distribution should still be even
      const countsByBook = selected.reduce(
        (acc, q) => {
          acc[q.bookKey] = (acc[q.bookKey] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      expect(countsByBook['book1']).toBe(3);
      expect(countsByBook['book2']).toBe(3);
    });

    it('should produce different results with different seeds', () => {
      const questions = createQuestionPool(['book1', 'book2', 'book3', 'book4'], 20);

      const random1 = createSeededRandom('seed-alpha');
      const random2 = createSeededRandom('seed-beta');

      const selected1 = seededSelectDistributed(questions, 12, random1);
      const selected2 = seededSelectDistributed(questions, 12, random2);

      // The answers should be different (very unlikely to be the same with different seeds)
      const answers1 = selected1.map((q) => q.answer).join(',');
      const answers2 = selected2.map((q) => q.answer).join(',');
      expect(answers1).not.toEqual(answers2);
    });
  });
});
