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

export function selectQuestions(
  questions: Question[], 
  count: number, 
  type: "in-which-book" | "content" | "both"
): Question[] {
  if (type === "both") {
    const iwbQuestions = questions.filter(q => q.type === "in-which-book");
    const contentQuestions = questions.filter(q => q.type === "content");
    
    const halfCount = Math.floor(count / 2);
    const iwbCount = Math.min(halfCount, iwbQuestions.length);
    const contentCount = count - iwbCount;

    return shuffle([
      ...shuffle(iwbQuestions).slice(0, iwbCount),
      ...shuffle(contentQuestions).slice(0, contentCount)
    ]);
  } else {
    return shuffle(
      questions.filter(q => q.type === type)
    ).slice(0, count);
  }
}

