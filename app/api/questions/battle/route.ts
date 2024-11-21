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

    let selectedQuestions: Question[];
    let message: string | null = null;

    // Only allow "in-which-book" questions if 4 or more books are selected
    if (selectedBooks.length < 4 && (questionType === "in-which-book" || questionType === "both")) {
      selectedQuestions = selectQuestions(filteredQuestions, questionCount, "content");
      message = "Choose at least 4 books to include 'In Which Book' questions in your battle!";
    } else {
      selectedQuestions = selectQuestions(filteredQuestions, questionCount, questionType);
    }

    // Add logging for debugging
    const questionCounts = selectedQuestions.reduce((acc: Record<string, number>, q) => {
      const bookTitle = booksData.books[q.book_key].title;
      acc[bookTitle] = (acc[bookTitle] || 0) + 1;
      return acc;
    }, {});
    console.log('Questions per book:', questionCounts);

    // Log question types
    const questionTypeCount = selectedQuestions.reduce((acc: Record<string, number>, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});
    console.log('Questions by type:', questionTypeCount);

    // Map questions to include the full book data after the conditional logic
    const questionsWithBooks = selectedQuestions.map((q: Question) => ({
      ...q,
      book: booksData.books[q.book_key]
    }));

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
