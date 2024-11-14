import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Book, Question, QuestionWithBook } from '@/types';
import { getAllQuestions, selectQuestions } from '@/lib/questions';

export async function POST(request: Request) {
  try {
    const { 
      selectedBooks, 
      questionCount = 16,
      questionType = "both",
      year,
      division
    } = await request.json() as { 
      selectedBooks: Book[],
      questionCount: number,
      questionType: "in-which-book" | "content" | "both",
      year: string,
      division: string
    };
    
    const booksPath = path.join(process.cwd(), 'public', 'obob', year, division, 'books.json');
    
    const [allQuestions, booksFile] = await Promise.all([
      getAllQuestions(year, division),
      fs.readFile(booksPath, 'utf8')
    ]);

    const booksData = JSON.parse(booksFile) as { books: Record<string, Book> };

    // Filter questions for selected books
    const filteredQuestions = allQuestions.filter((q: Question) =>
      selectedBooks.some(book => book.book_key === q.book_key)
    );

    let questionsWithBooks: QuestionWithBook[];
    let message: string | null = null;

    // Only allow "in-which-book" questions if 4 or more books are selected
    if (selectedBooks.length < 4 && (questionType === "in-which-book" || questionType === "both")) {
      const selectedQuestions = selectQuestions(filteredQuestions, questionCount, "content");
      questionsWithBooks = selectedQuestions.map((q: Question) => ({
        ...q,
        book: booksData.books[q.book_key]
      }));
      message = "Choose at least 4 books to include 'In Which Book' questions in your battle!";
    } else {
      const selectedQuestions = selectQuestions(filteredQuestions, questionCount, questionType);
      questionsWithBooks = selectedQuestions.map((q: Question) => ({
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
