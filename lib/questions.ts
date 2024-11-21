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
    
    // First pass: try to get questionsPerBook from each book
    for (let round = 0; round < questionsPerBook; round++) {
      for (const book of shuffledBooks) {
        const bookQuestions = shuffle(byBook[book]);
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
    for (const book of selectedBooks) {
      const bookQuestions = shuffle(byBook[book]);
      if (bookQuestions.length > 0) {
        selected.add(bookQuestions[0]);
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
    
    // Only filter out used books if we're requesting fewer questions than available books
    const usedBooks = new Set(selectedIwb.map(q => q.book_key));
    let remainingContentQuestions = contentQuestions;
    
    if (contentCount <= usedBooks.size) {
      remainingContentQuestions = contentQuestions.filter(q => !usedBooks.has(q.book_key));
    }
    
    if (remainingContentQuestions.length < contentCount) {
      remainingContentQuestions = contentQuestions;
    }
    
    const selectedContent = selectDistributedQuestions(remainingContentQuestions, contentCount);

    return [...selectedIwb, ...selectedContent];
  } else {
    const filteredQuestions = questions.filter(q => q.type === type);
    return selectDistributedQuestions(filteredQuestions, count);
  }
}

