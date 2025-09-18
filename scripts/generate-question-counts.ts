#!/usr/bin/env npx tsx

import { getAllQuestions } from '../lib/questions.js';
import path from 'path';
import fs from 'fs/promises';

interface QuestionCounts {
  [year: string]: {
    [division: string]: number;
  };
}

// Define all valid year/division combinations
const YEAR_DIVISION_COMBINATIONS = [
  { year: '2024-2025', division: '3-5' },
  { year: '2024-2025', division: '6-8' },
  { year: '2025-2026', division: '3-5' },
  { year: '2025-2026', division: '6-8' },
  { year: '2025-2026', division: '9-12' },
];

async function generateQuestionCounts(): Promise<void> {
  console.log('🔍 Computing question counts for all year/division combinations...');
  
  const counts: QuestionCounts = {};
  
  for (const { year, division } of YEAR_DIVISION_COMBINATIONS) {
    try {
      console.log(`  Computing ${year}/${division}...`);
      const questions = await getAllQuestions(year, division);
      const questionCount = questions.length;
      
      if (!counts[year]) {
        counts[year] = {};
      }
      counts[year][division] = questionCount;
      
      console.log(`    ✅ ${questionCount.toLocaleString()} questions found`);
    } catch (error) {
      console.error(`    ❌ Error computing ${year}/${division}:`, error);
      // Set count to 0 if there's an error loading questions
      if (!counts[year]) {
        counts[year] = {};
      }
      counts[year][division] = 0;
    }
  }
  
  // Write the counts to a JSON file
  const outputPath = path.join(process.cwd(), 'lib', 'question-counts.json');
  await fs.writeFile(outputPath, JSON.stringify(counts, null, 2));
  
  console.log('📊 Question counts generated successfully!');
  console.log('📁 Saved to:', outputPath);
  
  // Print summary
  console.log('\n📈 Summary:');
  for (const [year, divisions] of Object.entries(counts)) {
    console.log(`  ${year}:`);
    for (const [division, count] of Object.entries(divisions)) {
      console.log(`    ${division}: ${count.toLocaleString()} questions`);
    }
  }
}

// Run the script
generateQuestionCounts().catch((error) => {
  console.error('❌ Failed to generate question counts:', error);
  process.exit(1);
});
