import path from 'path';
import fs from 'fs/promises';
import { isSingleWordAnswer, isContentQuestion } from '../lib/crossword/utils';
import type { Question, Book } from '../types';

const YEARS_DIVISIONS = [
  { year: '2024-2025', divisions: ['3-5', '6-8'] },
  { year: '2025-2026', divisions: ['3-5', '6-8', '9-12'] },
];

async function getBooks(year: string, division: string): Promise<Book[]> {
  const booksPath = path.join(process.cwd(), 'public', 'obob', year, division, 'books.json');
  const content = await fs.readFile(booksPath, 'utf8');
  const data = JSON.parse(content);
  // books.json has { books: { [key]: Book } } structure
  return Object.values(data.books) as Book[];
}

async function getAllQuestions(year: string, division: string): Promise<Question[]> {
  const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
  const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
  const sources = JSON.parse(sourcesContent).sources as { path: string }[];
  
  const allQuestions: Question[] = [];
  for (const source of sources) {
    const questionsPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
    const content = await fs.readFile(questionsPath, 'utf8');
    const { questions } = JSON.parse(content);
    allQuestions.push(...questions);
  }
  return allQuestions;
}

async function main() {
  for (const { year, divisions } of YEARS_DIVISIONS) {
    for (const division of divisions) {
      console.log(`\n=== ${year} / ${division} ===`);
      
      const books = await getBooks(year, division);
      const questions = await getAllQuestions(year, division);
      
      let divisionTotal = 0;
      
      for (const book of books) {
        const bookQuestions = questions.filter(q => q.book_key === book.book_key);
        const validCount = bookQuestions.filter(q => 
          isContentQuestion(q) && isSingleWordAnswer((q as any).answer)
        ).length;
        
        divisionTotal += validCount;
        console.log(`  ${book.title}: ${validCount} clue candidates`);
      }
      
      console.log(`  TOTAL: ${divisionTotal} clue candidates`);
    }
  }
}

main().catch(console.error);
