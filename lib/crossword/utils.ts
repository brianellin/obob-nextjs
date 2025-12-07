import type { Question, ContentQuestion, Book } from "@/types";
import type { CrosswordQuestion } from "./types";

/**
 * Normalize an answer for crossword use:
 * - Uppercase
 * - Remove parenthetical content (page references, notes)
 * - Remove punctuation except letters
 * - Trim whitespace
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .trim()
    .toUpperCase()
    // Remove parenthetical notes like "(pg. 5)" or "(page 123)"
    .replace(/\(.*?\)/g, "")
    // Remove common page reference patterns
    .replace(/\bPG\.?\s*\d+\b/gi, "")
    .replace(/\bPAGE\s*\d+\b/gi, "")
    // Keep only letters (remove numbers, punctuation, spaces)
    .replace(/[^A-Z]/g, "")
    .trim();
}

/**
 * Check if an answer is a single word suitable for a crossword.
 * Must be 3+ letters and contain no spaces after normalization.
 */
export function isSingleWordAnswer(answer: string): boolean {
  const normalized = normalizeAnswer(answer);

  // Must be at least 3 letters
  if (normalized.length < 3) {
    return false;
  }

  // Must be at most 15 letters (reasonable for crossword)
  if (normalized.length > 15) {
    return false;
  }

  // The original answer (before removing non-letters) shouldn't have spaces
  // This catches "New York" which would normalize to "NEWYORK"
  const withoutParens = answer
    .trim()
    .replace(/\(.*?\)/g, "")
    .trim();

  // If there are spaces in the cleaned answer, it's multi-word
  if (/\s/.test(withoutParens)) {
    return false;
  }

  return true;
}

/**
 * Check if a question is a content question (type guard)
 */
export function isContentQuestion(
  question: Question
): question is ContentQuestion {
  return question.type === "content";
}

/**
 * Filter questions to only those suitable for crossword puzzles:
 * - Must be content questions (have answers)
 * - Must have single-word answers
 * - Must be from selected books
 */
export function filterCrosswordQuestions(
  questions: Question[],
  selectedBookKeys: string[],
  books: Book[]
): CrosswordQuestion[] {
  const bookMap = new Map(books.map((b) => [b.book_key, b]));

  return questions
    .filter((q): q is ContentQuestion => {
      // Must be content question
      if (!isContentQuestion(q)) return false;

      // Must be from selected books
      if (!selectedBookKeys.includes(q.book_key)) return false;

      // Must have single-word answer
      if (!isSingleWordAnswer(q.answer)) return false;

      return true;
    })
    .map((q) => {
      const book = bookMap.get(q.book_key);
      return {
        text: q.text,
        answer: normalizeAnswer(q.answer),
        bookKey: q.book_key,
        bookTitle: book?.title || q.book_key,
        page: q.page,
      };
    });
}

/**
 * Count how many valid crossword questions exist for each book
 */
export function countCrosswordQuestionsPerBook(
  questions: Question[],
  books: Book[]
): Map<string, number> {
  const counts = new Map<string, number>();

  // Initialize all books with 0
  for (const book of books) {
    counts.set(book.book_key, 0);
  }

  // Count valid questions per book
  for (const q of questions) {
    if (isContentQuestion(q) && isSingleWordAnswer(q.answer)) {
      const current = counts.get(q.book_key) || 0;
      counts.set(q.book_key, current + 1);
    }
  }

  return counts;
}

/**
 * Select questions distributed evenly across selected books.
 * Similar to the battle question selection but for crossword.
 */
export function selectDistributedQuestions(
  questions: CrosswordQuestion[],
  targetCount: number
): CrosswordQuestion[] {
  // Group questions by book
  const byBook = new Map<string, CrosswordQuestion[]>();
  for (const q of questions) {
    const existing = byBook.get(q.bookKey) || [];
    existing.push(q);
    byBook.set(q.bookKey, existing);
  }

  // Shuffle questions within each book
  for (const [key, bookQuestions] of byBook) {
    byBook.set(key, shuffleArray(bookQuestions));
  }

  const selected: CrosswordQuestion[] = [];
  const bookKeys = Array.from(byBook.keys());

  // Round-robin selection from each book
  let bookIndex = 0;
  const usedIndices = new Map<string, number>();

  while (selected.length < targetCount) {
    const bookKey = bookKeys[bookIndex % bookKeys.length];
    const bookQuestions = byBook.get(bookKey) || [];
    const usedIndex = usedIndices.get(bookKey) || 0;

    if (usedIndex < bookQuestions.length) {
      selected.push(bookQuestions[usedIndex]);
      usedIndices.set(bookKey, usedIndex + 1);
    }

    bookIndex++;

    // If we've gone through all books without adding anything, we're out of questions
    if (bookIndex > bookKeys.length * Math.ceil(targetCount / bookKeys.length)) {
      break;
    }
  }

  return selected;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
