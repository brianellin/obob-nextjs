import fs from 'fs/promises';
import path from 'path';

type QuestionSource = {
  path: string;
  name: string;
  link: string;
};

type Book = {
  book_key: string;
  title: string;
  author: string;
  cover: string;
  obob_division: string;
  obob_year: string;
};

type BaseQuestion = {
  type: "in-which-book" | "content";
  text: string;
  book_key: string;
  page: number;
};

type ContentQuestion = BaseQuestion & {
  type: "content";
  answer: string;
};

type Question = BaseQuestion | ContentQuestion;

// Question with source name attached (from getAllQuestions)
type QuestionWithSource = Question & { source_name: string };

async function getQuestionSources(year: string, division: string): Promise<QuestionSource[]> {
  try {
    const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
    const sourcesFile = await fs.readFile(sourcesPath, 'utf8');
    const sources = JSON.parse(sourcesFile) as { sources: QuestionSource[] };
    return sources.sources;
  } catch (error) {
    console.warn(`Failed to load sources.json for ${year}/${division}:`, error);
    return [];
  }
}

async function getBooks(year: string, division: string): Promise<Book[]> {
  try {
    const booksPath = path.join(process.cwd(), 'public', 'obob', year, division, 'books.json');
    const booksFile = await fs.readFile(booksPath, 'utf8');
    const booksData = JSON.parse(booksFile) as { books: Record<string, Book> };
    return Object.values(booksData.books);
  } catch (error) {
    console.warn(`Failed to load books.json for ${year}/${division}:`, error);
    return [];
  }
}

async function getAllQuestions(year: string, division: string): Promise<QuestionWithSource[]> {
  try {
    const questionSources = await getQuestionSources(year, division);
    
    const questionPaths = questionSources.map(source => 
      path.join(process.cwd(), 'public', 'obob', year, division, source.path)
    );
    
    const questionsFiles = await Promise.all(
      questionPaths.map(async (path) => {
        try {
          return await fs.readFile(path, 'utf8');
        } catch (error) {
          console.warn(`Failed to load questions from ${path}`, error);
          return JSON.stringify({ questions: [] });
        }
      })
    );
    
    const allQuestions = questionsFiles.map((file, index) => {
      const questions = (JSON.parse(file) as { questions: Question[] }).questions;
      const source = questionSources[index];
      return questions.map(q => ({
        ...q,
        source_name: source.name,
      }));
    }).flat();

    return allQuestions;
  } catch (error) {
    console.error(`Error loading questions for ${year}/${division}:`, error);
    return [];
  }
}

function escapeCSV(value: string | number | undefined): string {
  if (value === undefined || value === null) {
    return '';
  }
  const stringValue = String(value);
  // If the value contains commas, quotes, or newlines, wrap it in quotes and escape any quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

async function generateCSVForBook(
  book: Book,
  questions: QuestionWithSource[],
  year: string,
  division: string
): Promise<void> {
  // Filter questions for this book
  const bookQuestions = questions.filter(q => q.book_key === book.book_key);
  
  if (bookQuestions.length === 0) {
    console.log(`Skipping ${book.book_key} - no questions`);
    return;
  }

  // Sort by book_key, question_type, and page_number
  bookQuestions.sort((a, b) => {
    if (a.book_key !== b.book_key) return a.book_key.localeCompare(b.book_key);
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.page - b.page;
  });

  // Create CSV content
  const headers = ['book_key', 'question_type', 'page', 'text', 'answer', 'author_name', 'book_title', 'source_name'];
  const rows = bookQuestions.map(q => {
    const answer = q.type === 'content' ? (q as ContentQuestion).answer : '';
    return [
      escapeCSV(q.book_key),
      escapeCSV(q.type),
      escapeCSV(q.page),
      escapeCSV(q.text),
      escapeCSV(answer),
      escapeCSV(book.author),
      escapeCSV(book.title),
      escapeCSV(q.source_name || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'exports', year, division);
  await fs.mkdir(outputDir, { recursive: true });

  // Write CSV file
  const filename = `${book.book_key}-${year}-${division}.csv`;
  const outputPath = path.join(outputDir, filename);
  await fs.writeFile(outputPath, csvContent, 'utf8');
  
  console.log(`Generated: ${filename} (${bookQuestions.length} questions)`);
}

async function generateAllQuestionsCSV(
  books: Book[],
  questions: QuestionWithSource[],
  year: string,
  division: string
): Promise<void> {
  if (questions.length === 0) {
    console.log(`Skipping all-questions CSV - no questions`);
    return;
  }

  // Create a map of book_key to book for quick lookup
  const bookMap = new Map(books.map(book => [book.book_key, book]));

  // Sort by book_key, question_type, and page_number
  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.book_key !== b.book_key) return a.book_key.localeCompare(b.book_key);
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.page - b.page;
  });

  // Create CSV content
  const headers = ['book_key', 'question_type', 'page', 'text', 'answer', 'author_name', 'book_title', 'source_name'];
  const rows = sortedQuestions.map(q => {
    const book = bookMap.get(q.book_key);
    const answer = q.type === 'content' ? (q as ContentQuestion).answer : '';
    return [
      escapeCSV(q.book_key),
      escapeCSV(q.type),
      escapeCSV(q.page),
      escapeCSV(q.text),
      escapeCSV(answer),
      escapeCSV(book?.author || ''),
      escapeCSV(book?.title || ''),
      escapeCSV(q.source_name || ''),
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'exports', year, division);
  await fs.mkdir(outputDir, { recursive: true });

  // Write CSV file
  const filename = `obob-${year}-${division}-all-questions.csv`;
  const outputPath = path.join(outputDir, filename);
  await fs.writeFile(outputPath, csvContent, 'utf8');
  
  console.log(`Generated: ${filename} (${sortedQuestions.length} questions)`);
}

async function generateExportsForDivision(year: string, division: string): Promise<void> {
  console.log(`\nProcessing ${year}/${division}...`);
  
  const [books, questions] = await Promise.all([
    getBooks(year, division),
    getAllQuestions(year, division),
  ]);

  if (books.length === 0) {
    console.log(`No books found for ${year}/${division}`);
    return;
  }

  console.log(`Found ${books.length} books and ${questions.length} questions`);

  // Generate CSV for each book
  await Promise.all(
    books.map(book => generateCSVForBook(book, questions, year, division))
  );

  // Generate all-questions CSV for the division
  await generateAllQuestionsCSV(books, questions, year, division);
}

async function main() {
  console.log('Generating question exports...');

  const yearDivisionPairs = [
    { year: '2024-2025', division: '3-5' },
    { year: '2024-2025', division: '6-8' },
    { year: '2025-2026', division: '3-5' },
    { year: '2025-2026', division: '6-8' },
    { year: '2025-2026', division: '9-12' },
  ];

  for (const { year, division } of yearDivisionPairs) {
    await generateExportsForDivision(year, division);
  }

  console.log('\n✅ Question exports generated successfully!');
}

main().catch((error) => {
  console.error('Error generating exports:', error);
  process.exit(1);
});

