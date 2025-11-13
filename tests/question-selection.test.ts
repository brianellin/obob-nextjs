import { describe, it, expect } from 'vitest';
import { selectQuestions } from '@/lib/questions';
import type { Question } from '@/types';

// Helper to create mock questions
function createMockQuestion(
  bookKey: string,
  type: "in-which-book" | "content",
  index: number
): Question {
  const baseQuestion = {
    book_key: bookKey,
    text: `Question ${index} for ${bookKey}`,
    page: index,
  };

  if (type === "in-which-book") {
    return {
      ...baseQuestion,
      type: "in-which-book",
    };
  } else {
    return {
      ...baseQuestion,
      type: "content",
      answer: `Answer ${index}`,
    };
  }
}

// Helper to create a pool of questions across multiple books
function createQuestionPool(
  bookKeys: string[],
  questionsPerBook: number,
  type: "in-which-book" | "content" | "both"
): Question[] {
  const questions: Question[] = [];

  for (const bookKey of bookKeys) {
    if (type === "both") {
      // Split evenly between types
      const halfCount = Math.floor(questionsPerBook / 2);
      for (let i = 0; i < halfCount; i++) {
        questions.push(createMockQuestion(bookKey, "in-which-book", i));
      }
      for (let i = 0; i < questionsPerBook - halfCount; i++) {
        questions.push(createMockQuestion(bookKey, "content", i + halfCount));
      }
    } else {
      for (let i = 0; i < questionsPerBook; i++) {
        questions.push(createMockQuestion(bookKey, type, i));
      }
    }
  }

  return questions;
}

describe('Question Selection Logic', () => {
  describe('Basic Selection', () => {
    it('should select the correct number of questions', () => {
      const questions = createQuestionPool(['book1', 'book2', 'book3'], 10, 'content');
      const selected = selectQuestions(questions, 5, 'content');

      expect(selected).toHaveLength(5);
    });

    it('should only select questions of the specified type', () => {
      const questions = createQuestionPool(['book1', 'book2'], 5, 'both');

      const iwbSelected = selectQuestions(questions, 3, 'in-which-book');
      expect(iwbSelected.every(q => q.type === 'in-which-book')).toBe(true);

      const contentSelected = selectQuestions(questions, 3, 'content');
      expect(contentSelected.every(q => q.type === 'content')).toBe(true);
    });

    it('should handle requesting more questions than available', () => {
      const questions = createQuestionPool(['book1'], 5, 'content');
      const selected = selectQuestions(questions, 10, 'content');

      // Should return all available questions
      expect(selected.length).toBeLessThanOrEqual(5);
    });

    it('should handle empty question pool', () => {
      const questions: Question[] = [];
      const selected = selectQuestions(questions, 5, 'content');

      expect(selected).toHaveLength(0);
    });
  });

  describe('Distribution Across Books', () => {
    it('should distribute questions evenly when count > number of books', () => {
      const bookKeys = ['book1', 'book2', 'book3'];
      const questions = createQuestionPool(bookKeys, 10, 'content');
      const selected = selectQuestions(questions, 12, 'content');

      // Count questions per book
      const countsByBook = selected.reduce((acc, q) => {
        acc[q.book_key] = (acc[q.book_key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Each book should have at least 3 questions (12 / 3 = 4)
      const counts = Object.values(countsByBook);
      const minCount = Math.min(...counts);
      const maxCount = Math.max(...counts);

      // Distribution should be relatively even (within 1 question difference)
      expect(maxCount - minCount).toBeLessThanOrEqual(1);
    });

    it('should select from different books when count < number of books', () => {
      const bookKeys = ['book1', 'book2', 'book3', 'book4', 'book5'];
      const questions = createQuestionPool(bookKeys, 5, 'content');
      const selected = selectQuestions(questions, 3, 'content');

      // Should select from 3 different books
      const uniqueBooks = new Set(selected.map(q => q.book_key));
      expect(uniqueBooks.size).toBe(3);
    });

    it('should distribute round-robin style when count is multiple of books', () => {
      const bookKeys = ['book1', 'book2', 'book3'];
      const questions = createQuestionPool(bookKeys, 10, 'content');
      const selected = selectQuestions(questions, 9, 'content');

      // Count questions per book
      const countsByBook = selected.reduce((acc, q) => {
        acc[q.book_key] = (acc[q.book_key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Each book should have exactly 3 questions (9 / 3 = 3)
      expect(Object.values(countsByBook).every(count => count === 3)).toBe(true);
    });

    it('should handle uneven distribution when necessary', () => {
      const bookKeys = ['book1', 'book2', 'book3'];
      const questions = createQuestionPool(bookKeys, 10, 'content');
      const selected = selectQuestions(questions, 10, 'content');

      // All books should be represented
      const uniqueBooks = new Set(selected.map(q => q.book_key));
      expect(uniqueBooks.size).toBe(3);

      // Count should be 10 total
      expect(selected).toHaveLength(10);
    });
  });

  describe('Mixed Question Types (both)', () => {
    it('should split evenly between in-which-book and content for even counts', () => {
      const questions = createQuestionPool(['book1', 'book2', 'book3'], 10, 'both');
      const selected = selectQuestions(questions, 10, 'both');

      const iwbCount = selected.filter(q => q.type === 'in-which-book').length;
      const contentCount = selected.filter(q => q.type === 'content').length;

      // Should split 5-5
      expect(iwbCount).toBe(5);
      expect(contentCount).toBe(5);
    });

    it('should split evenly between types for odd counts', () => {
      const questions = createQuestionPool(['book1', 'book2', 'book3'], 10, 'both');
      const selected = selectQuestions(questions, 9, 'both');

      const iwbCount = selected.filter(q => q.type === 'in-which-book').length;
      const contentCount = selected.filter(q => q.type === 'content').length;

      // For odd count, should be 5-4 or 4-5
      expect(Math.abs(iwbCount - contentCount)).toBeLessThanOrEqual(1);
      expect(iwbCount + contentCount).toBe(9);
    });

    it('should handle both types when one type has limited questions', () => {
      const questions: Question[] = [
        ...createQuestionPool(['book1', 'book2'], 2, 'in-which-book'),
        ...createQuestionPool(['book1', 'book2'], 10, 'content'),
      ];

      const selected = selectQuestions(questions, 10, 'both');

      const iwbCount = selected.filter(q => q.type === 'in-which-book').length;
      const contentCount = selected.filter(q => q.type === 'content').length;

      // Should get 4 IWB (all available) and 6 content
      expect(iwbCount).toBe(4);
      expect(contentCount).toBe(6);
    });

    it('should return questions from both types', () => {
      const questions = createQuestionPool(['book1', 'book2'], 10, 'both');
      const selected = selectQuestions(questions, 8, 'both');

      const hasIWB = selected.some(q => q.type === 'in-which-book');
      const hasContent = selected.some(q => q.type === 'content');

      expect(hasIWB).toBe(true);
      expect(hasContent).toBe(true);
    });
  });

  describe('Real-world Mock Battle Scenarios', () => {
    it('should handle typical 16-question mock battle with 5 books', () => {
      const bookKeys = ['book1', 'book2', 'book3', 'book4', 'book5'];
      const questions = createQuestionPool(bookKeys, 20, 'both');
      const selected = selectQuestions(questions, 16, 'both');

      expect(selected).toHaveLength(16);

      // Should have questions from multiple books
      const uniqueBooks = new Set(selected.map(q => q.book_key));
      expect(uniqueBooks.size).toBeGreaterThan(1);

      // Should have both types
      const hasIWB = selected.some(q => q.type === 'in-which-book');
      const hasContent = selected.some(q => q.type === 'content');
      expect(hasIWB).toBe(true);
      expect(hasContent).toBe(true);
    });

    it('should handle minimum 4 books for in-which-book questions', () => {
      const bookKeys = ['book1', 'book2', 'book3', 'book4'];
      const questions = createQuestionPool(bookKeys, 10, 'both');
      const selected = selectQuestions(questions, 12, 'in-which-book');

      // Should select from all 4 books
      const uniqueBooks = new Set(selected.map(q => q.book_key));
      expect(uniqueBooks.size).toBe(4);
    });

    it('should distribute evenly in 20-question battle with 8 books', () => {
      const bookKeys = ['book1', 'book2', 'book3', 'book4', 'book5', 'book6', 'book7', 'book8'];
      const questions = createQuestionPool(bookKeys, 15, 'content');
      const selected = selectQuestions(questions, 20, 'content');

      expect(selected).toHaveLength(20);

      // Count per book
      const countsByBook = selected.reduce((acc, q) => {
        acc[q.book_key] = (acc[q.book_key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Each book should have 2-3 questions (20 / 8 ≈ 2.5)
      const counts = Object.values(countsByBook);
      expect(counts.every(c => c >= 2 && c <= 3)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single book selection', () => {
      const questions = createQuestionPool(['book1'], 20, 'content');
      const selected = selectQuestions(questions, 10, 'content');

      expect(selected).toHaveLength(10);
      expect(selected.every(q => q.book_key === 'book1')).toBe(true);
    });

    it('should handle all questions from one book when only one book available', () => {
      const questions = createQuestionPool(['book1'], 5, 'content');
      const selected = selectQuestions(questions, 10, 'content');

      // Should return all available questions even if less than requested
      expect(selected.length).toBeLessThanOrEqual(5);
    });

    it('should not return duplicate questions', () => {
      const questions = createQuestionPool(['book1', 'book2'], 10, 'content');
      const selected = selectQuestions(questions, 15, 'content');

      // Create unique set based on text (as a simple uniqueness check)
      const uniqueTexts = new Set(selected.map(q => q.text));
      expect(uniqueTexts.size).toBe(selected.length);
    });
  });
});
