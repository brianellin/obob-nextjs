#!/usr/bin/env npx tsx

/**
 * Analyzes question coverage across all books for the 2025-2026 season.
 * Shows which books have the least overall coverage (from ALL sources),
 * helping direct community contributors to where help is most needed.
 */

import fs from 'fs/promises';
import path from 'path';

interface Question {
  type: string;
  text: string;
  book_key: string;
  page: number;
  answer?: string;
  contributor?: string;
}

interface Book {
  book_key: string;
  title: string;
  author: string;
}

interface BookCoverage {
  book_key: string;
  title: string;
  author: string;
  division: string;
  totalQuestions: number;
  maxPage: number;
  questionsPerPage: number;
}

interface QuestionSource {
  path: string;
  name: string;
  link: string | null;
}

const YEAR = '2025-2026';
const DIVISIONS = ['3-5', '6-8', '9-12'];

async function loadBooks(division: string): Promise<Record<string, Book>> {
  const booksPath = path.join(process.cwd(), 'public', 'obob', YEAR, division, 'books.json');
  const content = await fs.readFile(booksPath, 'utf8');
  const data = JSON.parse(content) as { books: Record<string, Book> };
  return data.books;
}

async function loadQuestionSources(division: string): Promise<QuestionSource[]> {
  const sourcesPath = path.join(process.cwd(), 'public', 'obob', YEAR, division, 'sources.json');
  const content = await fs.readFile(sourcesPath, 'utf8');
  const data = JSON.parse(content) as { sources: QuestionSource[] };
  return data.sources;
}

async function loadQuestions(division: string, sourcePath: string): Promise<Question[]> {
  const fullPath = path.join(process.cwd(), 'public', 'obob', YEAR, division, sourcePath);
  try {
    const content = await fs.readFile(fullPath, 'utf8');
    const data = JSON.parse(content) as { questions: Question[] };
    return data.questions;
  } catch {
    return [];
  }
}

async function analyzeDivision(division: string): Promise<BookCoverage[]> {
  const books = await loadBooks(division);
  const sources = await loadQuestionSources(division);

  // Load all questions from all sources
  const allQuestionsByBook: Record<string, Question[]> = {};

  // Initialize with empty arrays for all books
  for (const bookKey of Object.keys(books)) {
    allQuestionsByBook[bookKey] = [];
  }

  // Load questions from each source
  for (const source of sources) {
    const questions = await loadQuestions(division, source.path);

    for (const q of questions) {
      if (allQuestionsByBook[q.book_key]) {
        allQuestionsByBook[q.book_key].push(q);
      }
    }
  }

  // Calculate coverage for each book
  const coverage: BookCoverage[] = [];

  for (const [bookKey, book] of Object.entries(books)) {
    const allQuestions = allQuestionsByBook[bookKey] || [];

    // Use max page from all questions as proxy for book length
    const maxPage = allQuestions.length > 0
      ? Math.max(...allQuestions.map(q => q.page || 0))
      : 0;

    coverage.push({
      book_key: bookKey,
      title: book.title,
      author: book.author,
      division,
      totalQuestions: allQuestions.length,
      maxPage,
      questionsPerPage: maxPage > 0 ? allQuestions.length / maxPage : 0,
    });
  }

  return coverage;
}

async function main() {
  console.log('📊 OBOB.dog Question Coverage Analysis (All Sources)');
  console.log('=====================================================\n');
  console.log('This report identifies books with the least question coverage,');
  console.log('helping community contributors know where to focus their efforts.\n');

  const allCoverage: BookCoverage[] = [];

  for (const division of DIVISIONS) {
    const coverage = await analyzeDivision(division);
    allCoverage.push(...coverage);
  }

  // Sort by questions per page (ascending - least covered first)
  const sortedByNeed = [...allCoverage].sort((a, b) =>
    a.questionsPerPage - b.questionsPerPage
  );

  // Print summary by division
  console.log('📚 Summary by Division:');
  console.log('─'.repeat(60));
  for (const division of DIVISIONS) {
    const divisionBooks = allCoverage.filter(b => b.division === division);
    const totalQuestions = divisionBooks.reduce((sum, b) => sum + b.totalQuestions, 0);
    const avgQuestionsPerPage = divisionBooks.reduce((sum, b) => sum + b.questionsPerPage, 0) / divisionBooks.length;

    console.log(`   ${division}: ${totalQuestions.toLocaleString()} questions across ${divisionBooks.length} books`);
    console.log(`         Average: ${avgQuestionsPerPage.toFixed(2)} questions per page\n`);
  }

  // Books needing the most help (lowest questions per page)
  console.log('\n🎯 BOOKS NEEDING THE MOST QUESTIONS:');
  console.log('─'.repeat(70));
  console.log('These books have the lowest question density (questions per page).\n');

  // Group by division for easier reading
  for (const division of DIVISIONS) {
    const divisionBooks = sortedByNeed
      .filter(b => b.division === division)
      .slice(0, 5); // Top 5 most needed per division

    console.log(`📖 ${division} Division - Top 5 books needing questions:`);
    for (let i = 0; i < divisionBooks.length; i++) {
      const book = divisionBooks[i];
      const density = book.questionsPerPage.toFixed(2);
      console.log(`   ${i + 1}. ${book.title}`);
      console.log(`      by ${book.author}`);
      console.log(`      ${book.totalQuestions} questions / ~${book.maxPage} pages (${density} q/page)\n`);
    }
  }

  // Full breakdown table
  console.log('\n📋 Full Coverage Breakdown (sorted by questions per page):');
  console.log('─'.repeat(95));
  console.log(
    'Div'.padEnd(6) +
    'Book'.padEnd(45) +
    'Questions'.padEnd(12) +
    'Pages'.padEnd(8) +
    'Q/Page'
  );
  console.log('─'.repeat(95));

  for (const book of sortedByNeed) {
    const qPerPage = book.questionsPerPage.toFixed(2);
    const title = book.title.length > 42 ? book.title.slice(0, 39) + '...' : book.title;

    console.log(
      book.division.padEnd(6) +
      title.padEnd(45) +
      String(book.totalQuestions).padEnd(12) +
      String(book.maxPage).padEnd(8) +
      qPerPage
    );
  }

  // Summary stats
  const totalQuestions = allCoverage.reduce((sum, b) => sum + b.totalQuestions, 0);
  const totalBooks = allCoverage.length;
  const avgDensity = allCoverage.reduce((sum, b) => sum + b.questionsPerPage, 0) / totalBooks;

  console.log('\n' + '─'.repeat(95));
  console.log(`\n📈 Overall Summary:`);
  console.log(`   Total questions (all sources): ${totalQuestions.toLocaleString()}`);
  console.log(`   Total books: ${totalBooks}`);
  console.log(`   Average question density: ${avgDensity.toFixed(2)} questions per page`);

  // Output the "needs help" list in a format easy to copy to the blog
  console.log('\n\n📝 FOR BLOG POST - Books needing the most questions:');
  console.log('─'.repeat(60));

  for (const division of DIVISIONS) {
    const divisionBooks = sortedByNeed
      .filter(b => b.division === division)
      .slice(0, 3); // Top 3 per division for blog

    const divisionLabel = division === '3-5' ? 'Elementary (3-5)'
      : division === '6-8' ? 'Middle School (6-8)'
      : 'High School (9-12)';

    console.log(`\n**${divisionLabel}:**`);
    for (const book of divisionBooks) {
      console.log(`- *${book.title}* by ${book.author} (${book.totalQuestions} questions)`);
    }
  }
}

main().catch(console.error);
