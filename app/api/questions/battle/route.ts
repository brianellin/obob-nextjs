import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Book, Question, QuestionWithBook } from '@/types';

export async function POST(request: Request) {
  try {
    // Get selected books from request body
    const { selectedBooks } = await request.json() as { selectedBooks: Book[] };
    
    // Load questions and books
    const questionsPath = path.join(process.cwd(), 'public/obob/questions.json');
    const booksPath = path.join(process.cwd(), 'public/obob/books.json');
    
    const [questionsFile, booksFile] = await Promise.all([
      fs.readFile(questionsPath, 'utf8'),
      fs.readFile(booksPath, 'utf8')
    ]);
    
    const questionsData = JSON.parse(questionsFile) as { questions: Question[] };
    const booksData = JSON.parse(booksFile) as { books: Record<string, Book> };

    // Filter questions based on selected books
    const filteredQuestions = questionsData.questions.filter((q: Question) =>
      selectedBooks.some(book => book.book_key === q.book_key)
    );

    let questionsWithBooks: QuestionWithBook[];
    let message: string | null = null;

    if (selectedBooks.length < 4) {
      // If less than 4 books, only use content questions
      const contentQuestions = filteredQuestions
        .filter((q: Question) => q.type === 'content')
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

      questionsWithBooks = contentQuestions.map((q: Question) => ({
        ...q,
        book: booksData.books[q.book_key]
      }));

      message = "Choose at least 4 books to add 'In Which Book' questions to your battle!";
    } else {
      // Normal case with both types of questions
      const inWhichBookQuestions = filteredQuestions
        .filter((q: Question) => q.type === 'in-which-book')
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      const contentQuestions = filteredQuestions
        .filter((q: Question) => q.type === 'content')
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

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
