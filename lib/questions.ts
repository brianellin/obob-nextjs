import path from 'path';
import fs from 'fs/promises';
import { Question } from '@/types';

type QuestionSource = {
  path: string;
  name: string;
  link: string;
};

async function getQuestionSources(year: string, division: string): Promise<QuestionSource[]> {
  try {
    const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
    const sourcesFile = await fs.readFile(sourcesPath, 'utf8');
    const sources = JSON.parse(sourcesFile) as { sources: QuestionSource[] };
    return sources.sources;
  } catch (error) {
    console.warn('Failed to load sources.json, falling back to empty sources:', error);
    return [];
  }
}

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getAllQuestions(year: string, division: string): Promise<Question[]> {
  try {
    const questionSources = await getQuestionSources(year, division);
    
    // Map paths to full system paths
    const questionPaths = questionSources.map(source => 
      path.join(process.cwd(), 'public', 'obob', year, division, source.path)
    );
    
    // Read all files concurrently
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
    
    // Parse and combine all question files, including source information
    const allQuestions = questionsFiles.map((file, index) => {
      const questions = (JSON.parse(file) as { questions: Question[] }).questions;
      const source = questionSources[index];
      return questions.map(q => ({
        ...q,
        source: {
          name: source.name,
          link: source.link
        }
      }));
    }).flat();

    return allQuestions;
  } catch (error) {
    console.error('Error loading questions:', error);
    throw new Error('Failed to load questions');
  }
}

function selectDistributedQuestions(questionPool: Question[], selectionCount: number): Question[] {
  const byBook = questionPool.reduce((acc, q) => {
    if (!acc[q.book_key]) acc[q.book_key] = [];
    acc[q.book_key].push(q);
    return acc;
  }, {} as Record<string, Question[]>);

  const uniqueBooks = Object.keys(byBook);
  const selected: Set<Question> = new Set();

  if (selectionCount > uniqueBooks.length) {
    // Calculate questions needed per book to distribute evenly
    const questionsPerBook = Math.ceil(selectionCount / uniqueBooks.length);
    const shuffledBooks = shuffle(uniqueBooks);

    // Shuffle each book's questions ONCE before the loops to avoid expensive repeated shuffles
    const shuffledByBook: Record<string, Question[]> = {};
    for (const book of shuffledBooks) {
      shuffledByBook[book] = shuffle(byBook[book]);
    }

    // First pass: try to get questionsPerBook from each book
    for (let round = 0; round < questionsPerBook; round++) {
      for (const book of shuffledBooks) {
        const bookQuestions = shuffledByBook[book];
        // Try to get the nth question from this book
        if (bookQuestions.length > round) {
          const question = bookQuestions[round];
          if (!selected.has(question)) {
            selected.add(question);
            if (selected.size >= selectionCount) break;
          }
        }
      }
      if (selected.size >= selectionCount) break;
    }

    // If we still need more questions, take any remaining available questions
    if (selected.size < selectionCount) {
      const remainingQuestions = questionPool.filter(q => !selected.has(q));
      for (const question of shuffle(remainingQuestions)) {
        selected.add(question);
        if (selected.size >= selectionCount) break;
      }
    }
  } else {
    // Original logic for when we need fewer questions than books
    const selectedBooks = shuffle(uniqueBooks).slice(0, selectionCount);

    // Select a random question from each book
    for (const book of selectedBooks) {
      const bookQuestions = byBook[book];
      if (bookQuestions.length > 0) {
        const randomQuestion = bookQuestions[Math.floor(Math.random() * bookQuestions.length)];
        selected.add(randomQuestion);
      }
    }
  }

  return shuffle(Array.from(selected)).slice(0, selectionCount);
}

export function selectQuestions(
  questions: Question[], 
  count: number, 
  type: "in-which-book" | "content" | "both"
): Question[] {
  if (type === "both") {
    const iwbQuestions = questions.filter(q => q.type === "in-which-book");
    const contentQuestions = questions.filter(q => q.type === "content");

    const halfCount = Math.ceil(count / 2);
    const iwbCount = Math.min(halfCount, iwbQuestions.length);
    const contentCount = Math.min(halfCount, contentQuestions.length);

    // Select IWB questions first
    const selectedIwb = selectDistributedQuestions(iwbQuestions, iwbCount);

    // Try to select content questions from different books than IWB questions
    // Only filter if we have enough remaining books to ensure good distribution
    const usedBooks = new Set(selectedIwb.map(q => q.book_key));
    const unusedContentQuestions = contentQuestions.filter(q => !usedBooks.has(q.book_key));

    // Count unique books available for content questions after filtering
    const unusedBookCount = new Set(unusedContentQuestions.map(q => q.book_key)).size;

    // Only use filtered questions if we have enough books for good distribution
    // We need at least half as many books as questions to avoid concentration
    const minBooksNeeded = Math.max(2, Math.ceil(contentCount / 4));

    let contentQuestionPool = contentQuestions;
    if (unusedBookCount >= minBooksNeeded && unusedContentQuestions.length >= contentCount) {
      // We have enough unused books and questions - prefer using them
      contentQuestionPool = unusedContentQuestions;
    }
    // Otherwise use all content questions (allows overlap with IWB books)

    const selectedContent = selectDistributedQuestions(contentQuestionPool, contentCount);

    return [...selectedIwb, ...selectedContent];
  } else {
    const filteredQuestions = questions.filter(q => q.type === type);
    return selectDistributedQuestions(filteredQuestions, count);
  }
}

