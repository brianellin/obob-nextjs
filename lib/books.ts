import path from 'path';
import fs from 'fs/promises';
import { Book } from '@/types';
import { getAllQuestions } from './questions';

export type BookStats = {
  book: Book;
  totalQuestions: number;
  byType: {
    content: number;
    'in-which-book': number;
  };
  bySource: Record<string, number>;
};

export async function getBooksWithStats(year: string, division: string): Promise<BookStats[]> {
  const booksPath = path.join(process.cwd(), 'public', 'obob', year, division, 'books.json');
  const [questions, booksFile] = await Promise.all([
    getAllQuestions(year, division),
    fs.readFile(booksPath, 'utf8'),
  ]);

  const booksData = JSON.parse(booksFile) as { books: Record<string, Book> };
  const books = Object.values(booksData.books);

  return books.map(book => {
    const bookQuestions = questions.filter(q => q.book_key === book.book_key);
    
    const stats: BookStats = {
      book,
      totalQuestions: bookQuestions.length,
      byType: {
        content: bookQuestions.filter(q => q.type === 'content').length,
        'in-which-book': bookQuestions.filter(q => q.type === 'in-which-book').length,
      },
      bySource: {}
    };

    // Count questions by source
    bookQuestions.forEach(question => {
      if (question.source) {
        stats.bySource[question.source.name] = (stats.bySource[question.source.name] || 0) + 1;
      }
    });

    return stats;
  });
} 