import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Book, Question } from '@/types';
import { getAllQuestions } from '@/lib/questions';

export async function POST(request: Request) {
  try {
    const {
      year,
      division,
      questionType,
      selectedBooks
    } = await request.json() as {
      year: string,
      division: string,
      questionType: "in-which-book" | "content" | "both",
      selectedBooks: Book[]
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

    // Filter by question type if not "both"
    let availableQuestions = filteredQuestions;
    if (questionType !== "both") {
      availableQuestions = filteredQuestions.filter((q: Question) => q.type === questionType);
    }

    // If no questions available, return error
    if (availableQuestions.length === 0) {
      return NextResponse.json(
        { error: 'No questions available for the selected criteria' },
        { status: 404 }
      );
    }

    // Select a random question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    // Map question to include the full book data
    const questionWithBook = {
      ...selectedQuestion,
      book: booksData.books[selectedQuestion.book_key]
    };

    return NextResponse.json({
      question: questionWithBook
    });
  } catch (error) {
    console.error('Error loading replacement question:', error);
    return NextResponse.json(
      { error: 'Failed to load replacement question' },
      { status: 500 }
    );
  }
}
