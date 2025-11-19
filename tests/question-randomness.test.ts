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

/**
 * Calculate the Chi-squared statistic to test if book distribution is random
 * Lower values indicate better randomness (more even distribution)
 */
function calculateChiSquared(observed: number[], expected: number): number {
  return observed.reduce((sum, obs) => {
    return sum + Math.pow(obs - expected, 2) / expected;
  }, 0);
}

/**
 * Run multiple trials and check if the book distribution is reasonably random
 * Returns statistics about the distribution
 */
function testBookDistributionRandomness(
  bookKeys: string[],
  questionsPerBook: number,
  questionType: "in-which-book" | "content" | "both",
  selectionCount: number,
  trials: number = 100
): {
  passed: boolean;
  averageChiSquared: number;
  maxImbalance: number;
  bookCoverage: number;
  details: string;
} {
  const bookCounts: Record<string, number> = {};
  let maxImbalance = 0;
  let chiSquaredSum = 0;

  // Initialize counts
  bookKeys.forEach(key => bookCounts[key] = 0);

  for (let trial = 0; trial < trials; trial++) {
    const questions = createQuestionPool(bookKeys, questionsPerBook, questionType);
    const selected = selectQuestions(questions, selectionCount, questionType);

    const trialCounts: Record<string, number> = {};
    bookKeys.forEach(key => trialCounts[key] = 0);

    selected.forEach(q => {
      bookCounts[q.book_key]++;
      trialCounts[q.book_key]++;
    });

    // Calculate imbalance for this trial
    const counts = Object.values(trialCounts);
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const imbalance = max - min;
    maxImbalance = Math.max(maxImbalance, imbalance);

    // Calculate chi-squared for this trial
    const expectedPerBook = selectionCount / bookKeys.length;
    const chiSquared = calculateChiSquared(counts, expectedPerBook);
    chiSquaredSum += chiSquared;
  }

  const averageChiSquared = chiSquaredSum / trials;
  const expectedTotalPerBook = (selectionCount * trials) / bookKeys.length;

  // Count how many books got at least some questions
  const booksWithQuestions = Object.values(bookCounts).filter(c => c > 0).length;
  const bookCoverage = booksWithQuestions / bookKeys.length;

  // Calculate how evenly distributed across trials
  const actualCounts = Object.values(bookCounts);
  const minTotal = Math.min(...actualCounts);
  const maxTotal = Math.max(...actualCounts);
  const totalImbalance = maxTotal - minTotal;
  const relativeImbalance = totalImbalance / expectedTotalPerBook;

  const details = `
    Trials: ${trials}
    Books: ${bookKeys.length}
    Questions per selection: ${selectionCount}
    Expected per book per trial: ${(selectionCount / bookKeys.length).toFixed(2)}
    Expected total per book: ${expectedTotalPerBook.toFixed(0)}
    Max single-trial imbalance: ${maxImbalance}
    Average Chi-squared: ${averageChiSquared.toFixed(2)}
    Book coverage: ${(bookCoverage * 100).toFixed(1)}%
    Total counts: ${JSON.stringify(bookCounts)}
    Total imbalance: ${totalImbalance} (${(relativeImbalance * 100).toFixed(1)}% of expected)
  `.trim();

  // Pass if:
  // 1. All books are used at least once across all trials
  // 2. Total imbalance is reasonable (< 30% of expected for large sample)
  // 3. Average chi-squared is reasonable for the degrees of freedom
  const degreesOfFreedom = bookKeys.length - 1;
  const criticalChiSquared = degreesOfFreedom * 3; // Rough heuristic

  const passed = bookCoverage === 1.0 &&
                 relativeImbalance < 0.3 &&
                 averageChiSquared < criticalChiSquared;

  return {
    passed,
    averageChiSquared,
    maxImbalance,
    bookCoverage,
    details
  };
}

describe('Question Selection Randomness', () => {
  describe('Content Questions - Book Distribution', () => {
    it('should distribute content questions across books randomly with 4 books', () => {
      const result = testBookDistributionRandomness(
        ['book1', 'book2', 'book3', 'book4'],
        20, // questions per book
        'content',
        8, // selection count
        100 // trials
      );

      expect(result.bookCoverage, `Book coverage issue:\n${result.details}`).toBe(1.0);
      expect(result.passed, `Randomness test failed:\n${result.details}`).toBe(true);
    });

    it('should distribute content questions across books randomly with 16 books', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);

      const result = testBookDistributionRandomness(
        bookKeys,
        20, // questions per book
        'content',
        16, // selection count (same as number of books)
        100 // trials
      );

      expect(result.bookCoverage, `Book coverage issue:\n${result.details}`).toBe(1.0);
      expect(result.passed, `Randomness test failed:\n${result.details}`).toBe(true);
    });

    it('should distribute content questions randomly when selections > books', () => {
      const result = testBookDistributionRandomness(
        ['book1', 'book2', 'book3', 'book4', 'book5'],
        20,
        'content',
        20, // more questions than books
        50
      );

      expect(result.bookCoverage, `Book coverage issue:\n${result.details}`).toBe(1.0);
      expect(result.passed, `Randomness test failed:\n${result.details}`).toBe(true);
    });
  });

  describe('In-Which-Book Questions - Book Distribution', () => {
    it('should distribute IWB questions across books randomly with 8 books', () => {
      const bookKeys = Array.from({ length: 8 }, (_, i) => `book${i + 1}`);

      const result = testBookDistributionRandomness(
        bookKeys,
        15,
        'in-which-book',
        8,
        100
      );

      expect(result.bookCoverage, `Book coverage issue:\n${result.details}`).toBe(1.0);
      expect(result.passed, `Randomness test failed:\n${result.details}`).toBe(true);
    });

    it('should distribute IWB questions randomly with 16 books', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);

      const result = testBookDistributionRandomness(
        bookKeys,
        20,
        'in-which-book',
        16,
        100
      );

      expect(result.bookCoverage, `Book coverage issue:\n${result.details}`).toBe(1.0);
      expect(result.passed, `Randomness test failed:\n${result.details}`).toBe(true);
    });
  });

  describe('Both Question Types - Book Distribution', () => {
    it('should distribute both question types randomly with 4 books', () => {
      const result = testBookDistributionRandomness(
        ['book1', 'book2', 'book3', 'book4'],
        20,
        'both',
        16,
        100
      );

      expect(result.bookCoverage, `Book coverage issue:\n${result.details}`).toBe(1.0);
      expect(result.passed, `Randomness test failed:\n${result.details}`).toBe(true);
    });

    it('should distribute both question types randomly with 16 books (friend battle scenario)', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);

      const result = testBookDistributionRandomness(
        bookKeys,
        20, // plenty of questions per book
        'both',
        16, // typical friend battle
        100
      );

      expect(result.bookCoverage, `Book coverage issue:\n${result.details}`).toBe(1.0);
      expect(result.passed, `Randomness test failed:\n${result.details}`).toBe(true);
    });

    it('should distribute both question types randomly with 8 books', () => {
      const bookKeys = Array.from({ length: 8 }, (_, i) => `book${i + 1}`);

      const result = testBookDistributionRandomness(
        bookKeys,
        20,
        'both',
        16,
        50
      );

      expect(result.bookCoverage, `Book coverage issue:\n${result.details}`).toBe(1.0);
      expect(result.passed, `Randomness test failed:\n${result.details}`).toBe(true);
    });
  });

  describe('Type-Specific Distribution within "Both" Mode', () => {
    it('should distribute content questions across different books than IWB in "both" mode', () => {
      const bookKeys = ['book1', 'book2', 'book3', 'book4', 'book5', 'book6'];
      const trials = 50;

      const contentBookUsage: Record<string, number> = {};
      const iwbBookUsage: Record<string, number> = {};
      bookKeys.forEach(key => {
        contentBookUsage[key] = 0;
        iwbBookUsage[key] = 0;
      });

      for (let i = 0; i < trials; i++) {
        const questions = createQuestionPool(bookKeys, 15, 'both');
        const selected = selectQuestions(questions, 12, 'both');

        selected.forEach(q => {
          if (q.type === 'content') {
            contentBookUsage[q.book_key]++;
          } else {
            iwbBookUsage[q.book_key]++;
          }
        });
      }

      // All books should be represented in both types across trials
      const contentBooksUsed = Object.values(contentBookUsage).filter(c => c > 0).length;
      const iwbBooksUsed = Object.values(iwbBookUsage).filter(c => c > 0).length;

      expect(contentBooksUsed).toBeGreaterThan(bookKeys.length * 0.8); // At least 80% of books
      expect(iwbBooksUsed).toBeGreaterThan(bookKeys.length * 0.8);

      // Content questions should not be heavily biased toward one book
      const contentCounts = Object.values(contentBookUsage);
      const maxContentCount = Math.max(...contentCounts);
      const totalContentQuestions = contentCounts.reduce((a, b) => a + b, 0);
      const maxContentPercentage = maxContentCount / totalContentQuestions;

      expect(maxContentPercentage).toBeLessThan(0.5); // No single book should have >50% of content questions
    });

    it('should not have all content questions from same book in single selection', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const trials = 50;
      let allSameBookCount = 0;

      for (let i = 0; i < trials; i++) {
        const questions = createQuestionPool(bookKeys, 20, 'both');
        const selected = selectQuestions(questions, 16, 'both');

        const contentQuestions = selected.filter(q => q.type === 'content');
        const uniqueContentBooks = new Set(contentQuestions.map(q => q.book_key));

        // If all content questions are from the same book, that's a bug
        if (uniqueContentBooks.size === 1 && contentQuestions.length > 1) {
          allSameBookCount++;
        }
      }

      // Should NEVER have all content questions from same book
      expect(allSameBookCount).toBe(0);
    });

    it('should select content questions from multiple books in each trial (16 books, both mode)', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const trials = 30;
      const minBooksPerTrial: number[] = [];

      for (let i = 0; i < trials; i++) {
        const questions = createQuestionPool(bookKeys, 20, 'both');
        const selected = selectQuestions(questions, 16, 'both');

        const contentQuestions = selected.filter(q => q.type === 'content');
        const uniqueContentBooks = new Set(contentQuestions.map(q => q.book_key));

        minBooksPerTrial.push(uniqueContentBooks.size);
      }

      const averageUniqueBooks = minBooksPerTrial.reduce((a, b) => a + b, 0) / trials;
      const minUniqueBooks = Math.min(...minBooksPerTrial);

      // On average, content questions should come from multiple books
      expect(averageUniqueBooks).toBeGreaterThan(2);
      // Every trial should have content from at least 2 different books
      expect(minUniqueBooks).toBeGreaterThan(1);
    });
  });

  describe('Statistical Randomness Across Multiple Runs', () => {
    it('should show different question selections across multiple runs', () => {
      const bookKeys = ['book1', 'book2', 'book3', 'book4'];
      const questions = createQuestionPool(bookKeys, 15, 'content');

      const selections: string[][] = [];
      const trials = 20;

      for (let i = 0; i < trials; i++) {
        const selected = selectQuestions(questions, 8, 'content');
        const questionTexts = selected.map(q => q.text).sort().join('|');
        selections.push(selected.map(q => q.text));

        // Store unique signature
        const signature = questionTexts;

        // Check if this exact selection has appeared before
        const previousSignature = selections.slice(0, -1).map(s => s.sort().join('|'));
        const isDuplicate = previousSignature.includes(signature);

        // Early runs might have duplicates by chance, but not too many
        if (i > 5) {
          expect(isDuplicate).toBe(false);
        }
      }

      // Across all trials, should have high variety
      const uniqueSelections = new Set(selections.map(s => s.sort().join('|')));
      expect(uniqueSelections.size).toBeGreaterThan(trials * 0.7);
    });

    it('should maintain even distribution pattern across runs', () => {
      const bookKeys = ['book1', 'book2', 'book3', 'book4', 'book5'];
      const trials = 30;
      const distributions: string[] = [];

      for (let i = 0; i < trials; i++) {
        const questions = createQuestionPool(bookKeys, 20, 'content');
        const selected = selectQuestions(questions, 10, 'content');

        const bookCounts: Record<string, number> = {};
        bookKeys.forEach(key => bookCounts[key] = 0);
        selected.forEach(q => bookCounts[q.book_key]++);

        // Create signature of distribution pattern (e.g., "2,2,2,2,2" or "3,2,2,2,1")
        const pattern = Object.values(bookCounts).sort((a, b) => b - a).join(',');
        distributions.push(pattern);

        // Each run should distribute relatively evenly
        const counts = Object.values(bookCounts);
        const max = Math.max(...counts);
        const min = Math.min(...counts);
        expect(max - min).toBeLessThanOrEqual(2); // Should be fairly even
      }
    });
  });

  describe('Filtering Logic in "Both" Mode', () => {
    it('should handle case where IWB uses exactly as many books as content count', () => {
      // This tests the specific edge case: contentCount (8) <= usedBooks.size (8)
      // which triggers the filtering logic in selectQuestions
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      for (let trial = 0; trial < 30; trial++) {
        const selected = selectQuestions(questions, 16, 'both');

        const iwbQuestions = selected.filter(q => q.type === 'in-which-book');
        const contentQuestions = selected.filter(q => q.type === 'content');

        const iwbBooks = new Set(iwbQuestions.map(q => q.book_key));
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        // Even when filtering is applied (contentCount <= usedBooks.size),
        // content questions should still come from multiple books
        expect(contentBooks.size,
          `Trial ${trial}: Only ${contentBooks.size} unique content books. IWB books: ${iwbBooks.size}`
        ).toBeGreaterThan(1);
      }
    });

    it('should not over-filter content questions when pool is limited after book exclusion', () => {
      // Create scenario where filtering would leave very few content questions
      const bookKeys = ['book1', 'book2', 'book3', 'book4', 'book5', 'book6', 'book7', 'book8'];

      // Limited content questions - only 2 per book
      const iwbQuestions = bookKeys.flatMap(key =>
        Array.from({ length: 10 }, (_, i) => createMockQuestion(key, 'in-which-book', i))
      );
      const contentQuestions = bookKeys.flatMap(key =>
        Array.from({ length: 2 }, (_, i) => createMockQuestion(key, 'content', i))
      );
      const questions = [...iwbQuestions, ...contentQuestions];

      const selected = selectQuestions(questions, 16, 'both');

      const contentSelected = selected.filter(q => q.type === 'content');
      const contentBookSet = new Set(contentSelected.map(q => q.book_key));

      // Should still distribute across multiple books, not collapse to one
      expect(contentBookSet.size).toBeGreaterThanOrEqual(Math.min(4, contentSelected.length));
    });
  });

  describe('Regression Tests for 16-Book Bug', () => {
    it('should not have all content questions from one book with 9 books selected (reported bug)', () => {
      // This is the EXACT scenario reported by the user
      const bookKeys = Array.from({ length: 9 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      let failedTrials = 0;
      const failureDetails: string[] = [];

      // Run multiple times to see if we can trigger the bug
      for (let trial = 0; trial < 50; trial++) {
        const selected = selectQuestions(questions, 16, 'both');

        const contentQuestions = selected.filter(q => q.type === 'content');
        const iwbQuestions = selected.filter(q => q.type === 'in-which-book');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));
        const iwbBooks = new Set(iwbQuestions.map(q => q.book_key));

        // Log details for this trial
        if (contentBooks.size === 1) {
          failedTrials++;
          failureDetails.push(
            `Trial ${trial}: ALL ${contentQuestions.length} content questions from ${[...contentBooks][0]}! ` +
            `IWB questions used ${iwbBooks.size} books: ${[...iwbBooks].join(', ')}`
          );
        }
      }

      if (failedTrials > 0) {
        console.log(`\n🐛 BUG DETECTED! ${failedTrials}/50 trials had all content from one book:`);
        failureDetails.forEach(detail => console.log(`  ${detail}`));
      }

      // This is the bug we're testing for - all content questions from same book
      expect(failedTrials,
        `Bug detected in ${failedTrials}/50 trials:\n${failureDetails.join('\n')}`
      ).toBe(0);
    });

    it('should not have all content questions from one book with 16 books selected', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      // Run multiple times to ensure consistency
      for (let trial = 0; trial < 20; trial++) {
        const selected = selectQuestions(questions, 16, 'both');

        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        // This is the bug we're testing for - all content questions from same book
        expect(contentBooks.size).toBeGreaterThan(1);
      }
    });

    it('should distribute content questions evenly with 16 books in friend mode', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');
      const selected = selectQuestions(questions, 16, 'both');

      const contentQuestions = selected.filter(q => q.type === 'content');
      const contentBookCounts: Record<string, number> = {};

      contentQuestions.forEach(q => {
        contentBookCounts[q.book_key] = (contentBookCounts[q.book_key] || 0) + 1;
      });

      const counts = Object.values(contentBookCounts);

      // With 8 content questions and 16 books, should be spread across multiple books
      // No book should dominate
      const maxCount = Math.max(...counts);
      const totalContent = contentQuestions.length;

      if (totalContent > 4) {
        // No book should have more than 50% of content questions
        expect(maxCount / totalContent).toBeLessThan(0.5);
      }
    });

    it('should ensure content questions come from at least 50% of books in 16-book scenario', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const trials = 30;

      for (let trial = 0; trial < trials; trial++) {
        const questions = createQuestionPool(bookKeys, 20, 'both');
        const selected = selectQuestions(questions, 16, 'both');

        const contentQuestions = selected.filter(q => q.type === 'content');
        const uniqueContentBooks = new Set(contentQuestions.map(q => q.book_key));

        // Content questions should come from at least 50% of available books
        const minExpectedBooks = Math.ceil(bookKeys.length * 0.5);
        expect(uniqueContentBooks.size,
          `Trial ${trial}: Content questions came from only ${uniqueContentBooks.size} books, expected at least ${minExpectedBooks}`
        ).toBeGreaterThanOrEqual(Math.min(minExpectedBooks, contentQuestions.length));
      }
    });

    it('should verify IWB and content questions use different book sets in "both" mode', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const trials = 20;

      for (let trial = 0; trial < trials; trial++) {
        const questions = createQuestionPool(bookKeys, 20, 'both');
        const selected = selectQuestions(questions, 16, 'both');

        const iwbBooks = new Set(selected.filter(q => q.type === 'in-which-book').map(q => q.book_key));
        const contentBooks = new Set(selected.filter(q => q.type === 'content').map(q => q.book_key));

        // With 16 books available, IWB and content should have some overlap but not be identical
        // and content shouldn't be a subset of IWB (which would indicate filtering issue)
        const overlap = new Set([...iwbBooks].filter(b => contentBooks.has(b)));

        // There should be at least some books used for content that aren't used for IWB
        const contentOnlyBooks = new Set([...contentBooks].filter(b => !iwbBooks.has(b)));

        expect(contentOnlyBooks.size,
          `Trial ${trial}: All content books (${[...contentBooks]}) were also IWB books (${[...iwbBooks]}), suggesting over-filtering`
        ).toBeGreaterThan(0);
      }
    });

    it('should maintain randomness with exactly 16 books and 16 questions (edge case)', () => {
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      // Track which books appear in content questions across trials
      const contentBookAppearances: Record<string, number> = {};
      bookKeys.forEach(key => contentBookAppearances[key] = 0);

      const trials = 50;
      for (let i = 0; i < trials; i++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');

        contentQuestions.forEach(q => {
          contentBookAppearances[q.book_key]++;
        });
      }

      // All books should appear at least once in content questions across trials
      const booksWithContentQuestions = Object.values(contentBookAppearances).filter(count => count > 0).length;
      const coverage = booksWithContentQuestions / bookKeys.length;

      expect(coverage,
        `Only ${booksWithContentQuestions} out of ${bookKeys.length} books appeared in content questions. Appearances: ${JSON.stringify(contentBookAppearances)}`
      ).toBeGreaterThan(0.8); // At least 80% of books should appear in content questions across trials
    });

    it('should distribute content questions across books with 9 books and varying question densities', () => {
      // Test with varying amounts of content questions per book (real-world scenario)
      const bookKeys = Array.from({ length: 9 }, (_, i) => `book${i + 1}`);

      // Simulate real-world variation: some books have more content questions than others
      const questions: Question[] = [];
      bookKeys.forEach((key, index) => {
        const iwbCount = 15;
        const contentCount = 10 + (index % 3) * 5; // Vary between 10-20 content questions

        for (let i = 0; i < iwbCount; i++) {
          questions.push(createMockQuestion(key, 'in-which-book', i));
        }
        for (let i = 0; i < contentCount; i++) {
          questions.push(createMockQuestion(key, 'content', i));
        }
      });

      const trials = 30;
      for (let trial = 0; trial < trials; trial++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Trial ${trial} with 9 books: Only ${contentBooks.size} unique content books`
        ).toBeGreaterThan(2); // At least 3 different books for content
      }
    });

    it('should handle 9 books with limited content questions per book', () => {
      // Worst case: very few content questions per book
      const bookKeys = Array.from({ length: 9 }, (_, i) => `book${i + 1}`);

      const questions: Question[] = [];
      bookKeys.forEach(key => {
        // Lots of IWB questions, but only 3 content questions per book
        for (let i = 0; i < 20; i++) {
          questions.push(createMockQuestion(key, 'in-which-book', i));
        }
        for (let i = 0; i < 3; i++) {
          questions.push(createMockQuestion(key, 'content', i));
        }
      });

      const trials = 20;
      let maxSingleBookDominance = 0;

      for (let trial = 0; trial < trials; trial++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');

        const contentBookCounts: Record<string, number> = {};
        contentQuestions.forEach(q => {
          contentBookCounts[q.book_key] = (contentBookCounts[q.book_key] || 0) + 1;
        });

        const counts = Object.values(contentBookCounts);
        if (counts.length > 0) {
          const maxCount = Math.max(...counts);
          const percentage = maxCount / contentQuestions.length;
          maxSingleBookDominance = Math.max(maxSingleBookDominance, percentage);
        }
      }

      // Even with limited content questions, no single book should dominate
      expect(maxSingleBookDominance).toBeLessThan(0.6); // No book should have >60% of content
    });
  });

  describe('Edge Cases Related to Filtering Bug', () => {
    it('should handle 5 books with 16 questions (questionCount > books)', () => {
      // When questionCount (8 content) > remaining books after filtering
      const bookKeys = Array.from({ length: 5 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      for (let trial = 0; trial < 30; trial++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        // With only 5 books total, content should still use multiple books
        expect(contentBooks.size,
          `Trial ${trial}: Only ${contentBooks.size} content books with 5 total books`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle 10 books with 16 questions (near boundary)', () => {
      // 10 books, 8 IWB (likely uses 8), 8 content (2 books remain after filter)
      const bookKeys = Array.from({ length: 10 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      for (let trial = 0; trial < 30; trial++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Trial ${trial}: Only ${contentBooks.size} content books with 10 total books`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle 6 books with 12 questions (smaller quiz)', () => {
      // 6 books, 6 IWB, 6 content - tests if bug occurs with smaller numbers
      const bookKeys = Array.from({ length: 6 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      for (let trial = 0; trial < 30; trial++) {
        const selected = selectQuestions(questions, 12, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Trial ${trial}: Only ${contentBooks.size} content books with 6 total books, 12 questions`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle 7 books with 20 questions (more questions than typical)', () => {
      // 7 books, 10 IWB, 10 content - more questions requested
      const bookKeys = Array.from({ length: 7 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      for (let trial = 0; trial < 30; trial++) {
        const selected = selectQuestions(questions, 20, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Trial ${trial}: Only ${contentBooks.size} content books with 7 total books, 20 questions`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle exact boundary: contentCount == usedBooks.size', () => {
      // This is the exact condition that triggers filtering
      // Test multiple book counts where this boundary is hit
      const scenarios = [
        { books: 5, questions: 8 },   // 4 IWB books, 4 content needed
        { books: 7, questions: 12 },  // 6 IWB books, 6 content needed
        { books: 9, questions: 16 },  // 8 IWB books, 8 content needed (the reported bug!)
        { books: 11, questions: 20 }, // 10 IWB books, 10 content needed
      ];

      for (const scenario of scenarios) {
        const bookKeys = Array.from({ length: scenario.books }, (_, i) => `book${i + 1}`);
        const questions = createQuestionPool(bookKeys, 20, 'both');

        const selected = selectQuestions(questions, scenario.questions, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Scenario: ${scenario.books} books, ${scenario.questions} questions - only ${contentBooks.size} content books`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle off-by-one boundaries: contentCount == usedBooks.size ± 1', () => {
      // Test the boundaries around the filtering condition
      const scenarios = [
        { books: 8, questions: 16 },  // contentCount (8) likely < usedBooks.size (7-8)
        { books: 10, questions: 16 }, // contentCount (8) likely > usedBooks.size (7-8)
        { books: 6, questions: 10 },  // contentCount (5) around usedBooks.size (5)
      ];

      for (const scenario of scenarios) {
        const bookKeys = Array.from({ length: scenario.books }, (_, i) => `book${i + 1}`);
        const questions = createQuestionPool(bookKeys, 20, 'both');

        for (let trial = 0; trial < 10; trial++) {
          const selected = selectQuestions(questions, scenario.questions, 'both');
          const contentQuestions = selected.filter(q => q.type === 'content');
          const contentBooks = new Set(contentQuestions.map(q => q.book_key));

          expect(contentBooks.size,
            `Scenario: ${scenario.books} books, ${scenario.questions} questions, trial ${trial}`
          ).toBeGreaterThan(1);
        }
      }
    });

    it('should handle uneven question distribution per book', () => {
      // Some books have many questions, some have few - real-world scenario
      const bookKeys = Array.from({ length: 9 }, (_, i) => `book${i + 1}`);
      const questions: Question[] = [];

      bookKeys.forEach((key, index) => {
        // Vary the number of questions per book significantly
        const iwbCount = 5 + (index * 3); // 5, 8, 11, 14, 17, 20, 23, 26, 29
        const contentCount = 3 + (index * 2); // 3, 5, 7, 9, 11, 13, 15, 17, 19

        for (let i = 0; i < iwbCount; i++) {
          questions.push(createMockQuestion(key, 'in-which-book', i));
        }
        for (let i = 0; i < contentCount; i++) {
          questions.push(createMockQuestion(key, 'content', i));
        }
      });

      for (let trial = 0; trial < 20; trial++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Trial ${trial}: Uneven distribution - only ${contentBooks.size} content books`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle when one book has no content questions', () => {
      // Real-world scenario: some books might have no content questions available
      const bookKeys = Array.from({ length: 9 }, (_, i) => `book${i + 1}`);
      const questions: Question[] = [];

      bookKeys.forEach((key, index) => {
        // First book has no content questions
        const iwbCount = 15;
        const contentCount = index === 0 ? 0 : 12;

        for (let i = 0; i < iwbCount; i++) {
          questions.push(createMockQuestion(key, 'in-which-book', i));
        }
        for (let i = 0; i < contentCount; i++) {
          questions.push(createMockQuestion(key, 'content', i));
        }
      });

      for (let trial = 0; trial < 20; trial++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Trial ${trial}: One book with no content - only ${contentBooks.size} content books used`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle odd question counts (15, 17, 19, 21)', () => {
      // Odd numbers might cause issues with ceiling division
      const bookKeys = Array.from({ length: 9 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      const oddCounts = [15, 17, 19, 21];

      for (const count of oddCounts) {
        const selected = selectQuestions(questions, count, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Question count ${count}: Only ${contentBooks.size} content books`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle contentCount < usedBooks.size (no filtering should occur)', () => {
      // When contentCount is much smaller than usedBooks, filtering shouldn't happen
      const bookKeys = Array.from({ length: 12 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      // Request only 8 questions total (4 IWB, 4 content)
      // IWB will use ~4 books, content needs 4, so 4 <= 4 might still trigger
      for (let trial = 0; trial < 20; trial++) {
        const selected = selectQuestions(questions, 8, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        expect(contentBooks.size,
          `Trial ${trial}: Small question count - only ${contentBooks.size} content books`
        ).toBeGreaterThan(1);
      }
    });

    it('should handle maximum book selection (all available books)', () => {
      // User selects all 16 books in a division
      const bookKeys = Array.from({ length: 16 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 15, 'both');

      for (let trial = 0; trial < 20; trial++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        // Should use a significant portion of the 16 books
        expect(contentBooks.size,
          `Trial ${trial}: All 16 books available - only ${contentBooks.size} content books used`
        ).toBeGreaterThan(3);
      }
    });

    it('should handle minimum book selection (4 books)', () => {
      // Minimum required for IWB questions
      const bookKeys = Array.from({ length: 4 }, (_, i) => `book${i + 1}`);
      const questions = createQuestionPool(bookKeys, 20, 'both');

      for (let trial = 0; trial < 20; trial++) {
        const selected = selectQuestions(questions, 16, 'both');
        const contentQuestions = selected.filter(q => q.type === 'content');
        const contentBooks = new Set(contentQuestions.map(q => q.book_key));

        // With only 4 books, should still use multiple books for content
        expect(contentBooks.size,
          `Trial ${trial}: Minimum 4 books - only ${contentBooks.size} content books used`
        ).toBeGreaterThan(1);
      }
    });
  });
});
