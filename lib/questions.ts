import path from 'path';
import fs from 'fs/promises';
import { Question } from '@/types';

// Define question sources
export const QUESTION_SOURCES = [
  { path: 'obob/lake_oswego/questions.json', name: 'Lake Oswego Library', link: 'https://www.ci.oswego.or.us/kids/obob-practice-questions' },
  { path: 'obob/cedar_mill/questions.json', name: 'Cedar Mill Library', link: 'https://library.cedarmill.org/kids/obob/' },
  { path: 'obob/glencoe/glencoe_questions.json', name: 'Glencoe Elementary', link: 'https://www.glencoeelementarypta.com/obob' },
];

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

