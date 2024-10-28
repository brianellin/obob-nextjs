import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Book, Question, QuestionWithBook } from '@/types';

// Add this helper function at the top level
function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array]; // Create a copy to avoid mutating the original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Define question sources
const QUESTION_SOURCES = [
  { path: 'obob/lake_oswego/questions.json', name: 'Lake Oswego Library', link: 'https://www.ci.oswego.or.us/kids/obob-practice-questions' },
  { path: 'obob/cedar_mill/questions.json', name: 'Cedar Mill Library', link: 'https://library.cedarmill.org/kids/obob/' },
  // Add more sources here as needed
];

export async function POST(request: Request) {
  try {
    // Get selected books from request body
    const { selectedBooks } = await request.json() as { selectedBooks: Book[] };
    
    // Map paths to full system paths
    const questionPaths = QUESTION_SOURCES.map(source => 
      path.join(process.cwd(), 'public', source.path)
    );
    const booksPath = path.join(process.cwd(), 'public', 'obob/books.json');
    
    // Read all files concurrently
    const [questionsFiles, booksFile] = await Promise.all([
      Promise.all(questionPaths.map(path => fs.readFile(path, 'utf8'))),
      fs.readFile(booksPath, 'utf8')
    ]);
    
    // Parse and combine all question files, including source information
    const allQuestions = questionsFiles.map((file, index) => {
      const questions = (JSON.parse(file) as { questions: Question[] }).questions;
      const source = QUESTION_SOURCES[index];
      return questions.map(q => ({
        ...q,
        source: {
          name: source.name,
          link: source.link
        }
      }));
    }).flat();

    const booksData = JSON.parse(booksFile) as { books: Record<string, Book> };

    console.log(`Loaded ${allQuestions.length} questions`);

    // Filter questions based on selected books
    const filteredQuestions = allQuestions.filter((q: Question) =>
      selectedBooks.some(book => book.book_key === q.book_key)
    );

    let questionsWithBooks: QuestionWithBook[];
    let message: string | null = null;

    if (selectedBooks.length < 4) {
      // If less than 4 books, only use content questions
      const contentQuestions = shuffle(
        filteredQuestions.filter((q: Question) => q.type === 'content')
      ).slice(0, 8);

      questionsWithBooks = contentQuestions.map((q: Question) => ({
        ...q,
        book: booksData.books[q.book_key]
      }));

      message = "Choose at least 4 books to add 'In Which Book' questions to your battle!";
    } else {
      // Normal case with both types of questions
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
