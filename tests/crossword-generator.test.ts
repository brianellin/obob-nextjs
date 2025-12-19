import { describe, it, expect } from 'vitest';
import { generateCrossword } from '@/lib/crossword/generator';
import type { CrosswordQuestion } from '@/lib/crossword/types';

// Create a pool of questions with unique answers for testing
function createTestQuestionPool(): CrosswordQuestion[] {
  const words = [
    'CAT', 'DOG', 'BIRD', 'FISH', 'LION', 'BEAR', 'WOLF', 'FOX', 'OWL', 'BAT',
    'TIGER', 'MOUSE', 'EAGLE', 'SHARK', 'WHALE', 'SNAKE', 'FROG', 'DEER', 'MOOSE', 'GOAT'
  ];
  return words.map((answer, i) => ({
    text: `What animal is ${answer.toLowerCase()}?`,
    answer,
    bookKey: `book${(i % 3) + 1}`,
    bookTitle: `Book ${(i % 3) + 1}`,
    page: i + 1,
  }));
}

describe('generateCrossword', () => {
  it('should not have duplicate answers in clues', () => {
    const questions = createTestQuestionPool();

    const puzzle = generateCrossword(questions, {
      targetWords: 8,
      maxGridSize: 12,
      minWords: 4,
      maxAttempts: 3, // Minimal attempts for speed
    });

    if (puzzle) {
      const answers = puzzle.clues.map(c => c.answer);
      const uniqueAnswers = new Set(answers);
      expect(uniqueAnswers.size).toBe(answers.length);
    }
  });

  it('should not have the same question appear in both across and down', () => {
    const questions = createTestQuestionPool();

    const puzzle = generateCrossword(questions, {
      targetWords: 8,
      maxGridSize: 12,
      minWords: 4,
      maxAttempts: 3,
    });

    if (puzzle) {
      const acrossAnswers = puzzle.clues
        .filter(c => c.direction === 'across')
        .map(c => c.answer);
      const downAnswers = puzzle.clues
        .filter(c => c.direction === 'down')
        .map(c => c.answer);

      const overlap = acrossAnswers.filter(a => downAnswers.includes(a));
      expect(overlap).toHaveLength(0);
    }
  });

  it('should not have duplicate question texts in clues', () => {
    const questions = createTestQuestionPool();

    const puzzle = generateCrossword(questions, {
      targetWords: 8,
      maxGridSize: 12,
      minWords: 4,
      maxAttempts: 3,
    });

    if (puzzle) {
      const texts = puzzle.clues.map(c => c.text);
      const uniqueTexts = new Set(texts);
      expect(uniqueTexts.size).toBe(texts.length);
    }
  });

  it('should return null when not enough questions provided', () => {
    const questions = createTestQuestionPool().slice(0, 3);

    const puzzle = generateCrossword(questions, {
      targetWords: 12,
      maxGridSize: 18,
      minWords: 8,
      maxAttempts: 1,
    });

    expect(puzzle).toBeNull();
  });
});
