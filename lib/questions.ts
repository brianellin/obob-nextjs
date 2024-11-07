import path from 'path';
import fs from 'fs/promises';
import { Question } from '@/types';

// Define question sources
export const QUESTION_SOURCES = [
  { path: 'obob/lake_oswego/questions.json', name: 'Lake Oswego Library', link: 'https://www.ci.oswego.or.us/kids/obob-practice-questions' },
  { path: 'obob/cedar_mill/questions.json', name: 'Cedar Mill Library', link: 'https://library.cedarmill.org/kids/obob/' },
  { path: 'obob/glencoe/glencoe_questions.json', name: 'Glencoe Elementary', link: 'https://www.glencoeelementarypta.com/obob' },
];

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function getAllQuestions(): Promise<Question[]> {
  try {
    // Map paths to full system paths
    const questionPaths = QUESTION_SOURCES.map(source => 
      path.join(process.cwd(), 'public', source.path)
    );
    
    // Read all files concurrently
    const questionsFiles = await Promise.all(
      questionPaths.map(path => fs.readFile(path, 'utf8'))
    );
    
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

