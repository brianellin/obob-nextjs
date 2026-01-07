import { describe, it, expect, beforeAll } from 'vitest';
import { generateDailyPuzzle, getPacificDateString } from '@/lib/daily-crossword/generate-daily';
import type { DailyPuzzle } from '@/lib/daily-crossword/types';

const TEST_YEAR = '2025-2026';
const TEST_DIVISION = '6-8';

describe('Daily Crossword Generation', () => {
  describe('Deterministic generation by date', () => {
    it('generates the same puzzle for the same date', async () => {
      const dateString = '2025-03-15';
      
      const puzzle1 = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, dateString);
      const puzzle2 = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, dateString);
      
      expect(puzzle1.puzzle.clues.map(c => c.answer).sort())
        .toEqual(puzzle2.puzzle.clues.map(c => c.answer).sort());
      expect(puzzle1.puzzle.grid).toEqual(puzzle2.puzzle.grid);
    });

    it('generates different puzzles for different dates', async () => {
      const puzzle1 = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, '2025-03-15');
      const puzzle2 = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, '2025-03-16');
      
      const answers1 = puzzle1.puzzle.clues.map(c => c.answer).sort().join(',');
      const answers2 = puzzle2.puzzle.clues.map(c => c.answer).sort().join(',');
      
      expect(answers1).not.toEqual(answers2);
    });

    it('generates different puzzles for different divisions on same date', async () => {
      const dateString = '2025-03-15';
      
      const puzzle35 = await generateDailyPuzzle(TEST_YEAR, '3-5', dateString);
      const puzzle68 = await generateDailyPuzzle(TEST_YEAR, '6-8', dateString);
      
      const answers35 = puzzle35.puzzle.clues.map(c => c.answer).sort().join(',');
      const answers68 = puzzle68.puzzle.clues.map(c => c.answer).sort().join(',');
      
      expect(answers35).not.toEqual(answers68);
    });
  });

  describe('No duplicate answers within a puzzle', () => {
    it('puzzle has no duplicate answers', async () => {
      const puzzle = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, '2025-04-01');
      
      const answers = puzzle.puzzle.clues.map(c => c.answer);
      const uniqueAnswers = new Set(answers);
      
      expect(uniqueAnswers.size).toBe(answers.length);
    });

    it('multiple consecutive days have no duplicates within each puzzle', async () => {
      const dates = ['2025-04-10', '2025-04-11', '2025-04-12', '2025-04-13', '2025-04-14'];
      
      for (const dateString of dates) {
        const puzzle = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, dateString);
        const answers = puzzle.puzzle.clues.map(c => c.answer);
        const uniqueAnswers = new Set(answers);
        
        expect(uniqueAnswers.size, `Duplicate found in puzzle for ${dateString}`).toBe(answers.length);
      }
    });
  });

  describe('Day-to-day question variation', () => {
    it('today and yesterday have different question sets', async () => {
      const yesterday = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, '2025-05-14');
      const today = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, '2025-05-15');
      
      const yesterdayAnswers = new Set(yesterday.puzzle.clues.map(c => c.answer));
      const todayAnswers = new Set(today.puzzle.clues.map(c => c.answer));
      
      // Calculate overlap
      let overlap = 0;
      for (const answer of todayAnswers) {
        if (yesterdayAnswers.has(answer)) {
          overlap++;
        }
      }
      
      // Less than 50% overlap is acceptable (some overlap is fine, but not too much)
      const overlapPercent = overlap / todayAnswers.size;
      expect(overlapPercent).toBeLessThan(0.5);
    });

    it('a week of puzzles all have variation', async () => {
      const dates = [
        '2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04',
        '2025-06-05', '2025-06-06', '2025-06-07'
      ];
      
      const puzzles = await Promise.all(
        dates.map(d => generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, d))
      );
      
      // Collect all unique answer sets
      const answerSets = puzzles.map(p => 
        new Set(p.puzzle.clues.map(c => c.answer))
      );
      
      // Each pair of adjacent days should have less than 50% overlap
      for (let i = 0; i < answerSets.length - 1; i++) {
        let overlap = 0;
        for (const answer of answerSets[i]) {
          if (answerSets[i + 1].has(answer)) {
            overlap++;
          }
        }
        const overlapPercent = overlap / answerSets[i].size;
        expect(overlapPercent, `Day ${i} and ${i + 1} have too much overlap`).toBeLessThan(0.5);
      }
    });
  });

  describe('Puzzle structure validation', () => {
    let puzzle: DailyPuzzle;

    beforeAll(async () => {
      puzzle = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, '2025-07-01');
    });

    it('has required metadata fields', () => {
      expect(puzzle.id).toBeDefined();
      expect(puzzle.year).toBe(TEST_YEAR);
      expect(puzzle.division).toBe(TEST_DIVISION);
      expect(puzzle.dateString).toBe('2025-07-01');
      expect(puzzle.generatedAt).toBeGreaterThan(0);
      expect(puzzle.clueCount).toBeGreaterThan(0);
    });

    it('has a valid grid', () => {
      expect(puzzle.puzzle.grid).toBeDefined();
      expect(puzzle.puzzle.rows).toBeGreaterThan(0);
      expect(puzzle.puzzle.cols).toBeGreaterThan(0);
      expect(puzzle.puzzle.grid.length).toBe(puzzle.puzzle.rows);
      expect(puzzle.puzzle.grid[0].length).toBe(puzzle.puzzle.cols);
    });

    it('has square grid', () => {
      expect(puzzle.puzzle.rows).toBe(puzzle.puzzle.cols);
    });

    it('has minimum number of clues', () => {
      expect(puzzle.puzzle.clues.length).toBeGreaterThanOrEqual(14);
    });

    it('all clues have required fields', () => {
      for (const clue of puzzle.puzzle.clues) {
        expect(clue.id).toBeDefined();
        expect(clue.number).toBeGreaterThan(0);
        expect(['across', 'down']).toContain(clue.direction);
        expect(clue.text.length).toBeGreaterThan(0);
        expect(clue.answer.length).toBeGreaterThanOrEqual(3);
        expect(clue.startRow).toBeGreaterThanOrEqual(0);
        expect(clue.startCol).toBeGreaterThanOrEqual(0);
        expect(clue.length).toBe(clue.answer.length);
        expect(clue.bookKey).toBeDefined();
        expect(clue.bookTitle).toBeDefined();
      }
    });

    it('all answers are uppercase letters only', () => {
      for (const clue of puzzle.puzzle.clues) {
        expect(clue.answer).toMatch(/^[A-Z]+$/);
      }
    });

    it('clue answers match grid letters', () => {
      for (const clue of puzzle.puzzle.clues) {
        for (let i = 0; i < clue.length; i++) {
          const row = clue.direction === 'down' ? clue.startRow + i : clue.startRow;
          const col = clue.direction === 'across' ? clue.startCol + i : clue.startCol;
          
          const gridLetter = puzzle.puzzle.grid[row][col];
          const answerLetter = clue.answer[i];
          
          expect(gridLetter, `Mismatch at ${row},${col} for clue "${clue.text}"`).toBe(answerLetter);
        }
      }
    });
  });

  describe('Book distribution', () => {
    it('includes questions from multiple books', async () => {
      const puzzle = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, '2025-08-01');
      
      const bookKeys = new Set(puzzle.puzzle.clues.map(c => c.bookKey));
      
      // Should have questions from at least 3 different books
      expect(bookKeys.size).toBeGreaterThanOrEqual(3);
    });

    it('has roughly even distribution across books', async () => {
      const puzzle = await generateDailyPuzzle(TEST_YEAR, TEST_DIVISION, '2025-08-15');
      
      const bookCounts = new Map<string, number>();
      for (const clue of puzzle.puzzle.clues) {
        bookCounts.set(clue.bookKey, (bookCounts.get(clue.bookKey) || 0) + 1);
      }
      
      const counts = Array.from(bookCounts.values());
      const maxCount = Math.max(...counts);
      const minCount = Math.min(...counts);
      
      // No single book should dominate (max shouldn't be more than 3x min)
      expect(maxCount).toBeLessThanOrEqual(minCount * 3 + 1);
    });
  });

  describe('Pacific Time date handling', () => {
    it('getPacificDateString returns YYYY-MM-DD format', () => {
      const date = new Date('2025-06-15T12:00:00Z');
      const dateString = getPacificDateString(date);
      
      expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
