import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Book, Question, QuestionWithBook } from '@/types';
import { getAllQuestions } from '@/lib/questions';

function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export async function POST(request: Request) {
  try {
    const { selectedBooks } = await request.json() as { selectedBooks: Book[] };
    
    const booksPath = path.join(process.cwd(), 'public', 'obob/books.json');
    
    // Use the new getAllQuestions function
    const [allQuestions, booksFile] = await Promise.all([
      getAllQuestions(),
      fs.readFile(booksPath, 'utf8')
    ]);

    const booksData = JSON.parse(booksFile) as { books: Record<string, Book> };

    console.log(`Loaded ${allQuestions.length} questions`);

    // Rest of the code remains the same...
    const filteredQuestions = allQuestions.filter((q: Question) =>
      selectedBooks.some(book => book.book_key === q.book_key)
    );

    let questionsWithBooks: QuestionWithBook[];
    let message: string | null = null;

    if (selectedBooks.length < 4) {
      const contentQuestions = shuffle(
        filteredQuestions.filter((q: Question) => q.type === 'content')
      ).slice(0, 8);

      questionsWithBooks = contentQuestions.map((q: Question) => ({
        ...q,
        book: booksData.books[q.book_key]
      }));

      message = "Choose at least 4 books to add 'In Which Book' questions to your battle!";
    } else {
      const inWhichBookQuestions = shuffle(
        filteredQuestions.filter((q: Question) => q.type === 'in-which-book')
      ).slice(0, 4);

      const contentQuestions = shuffle(
        filteredQuestions.filter((q: Question) => q.type === 'content')
      ).slice(0, 4);

      questionsWithBooks = [...inWhichBookQuestions, ...contentQuestions]
        .map((q: Question) => ({
          ...q,
          book: booksData.books[q.book_key]
        }));
    }

    return NextResponse.json({ 
      questions: questionsWithBooks,
      message
    });
  } catch (error) {
    console.error('Error loading questions:', error);
    return NextResponse.json(
      { error: 'Failed to load questions' },
      { status: 500 }
    );
  }
}
