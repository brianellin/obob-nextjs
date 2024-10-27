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
    
    const questionsData = JSON.parse(questionsFile);
    const booksData = JSON.parse(booksFile);

    // Filter questions based on selected books
    const filteredQuestions = questionsData.questions.filter((q: Question) =>
      selectedBooks.some(book => book.bookKey === q.bookKey)
    );

    let questionsWithBooks: QuestionWithBook[];
    let message: string | null = null;

    if (selectedBooks.length < 4) {
      // If less than 4 books, only use content questions
      const contentQuestions = filteredQuestions
        .filter(q => q.type === 'content')
        .sort(() => Math.random() - 0.5)
        .slice(0, 8);

      questionsWithBooks = contentQuestions.map((q: Question) => ({
        ...q,
        book: booksData.books[q.bookKey]
      }));

      message = "Select 4 or more books to include 'In Which Book' questions in your battle!";
    } else {
      // Normal case with both types of questions
      const inWhichBookQuestions = filteredQuestions
        .filter(q => q.type === 'in-which-book')
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      const contentQuestions = filteredQuestions
        .filter(q => q.type === 'content')
        .sort(() => Math.random() - 0.5)
        .slice(0, 4);

      questionsWithBooks = [...inWhichBookQuestions, ...contentQuestions]
        .map((q: Question) => ({
          ...q,
          book: booksData.books[q.bookKey]
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
