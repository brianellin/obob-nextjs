#!/usr/bin/env node

/**
 * Script to combine multiple individual question JSON files into a single questions.json
 *
 * Usage: node scripts/combine-questions.js <directory>
 *
 * Example: node scripts/combine-questions.js public/obob/2025-2026/6-8/cedar_mill
 *
 * This script looks for files matching the pattern *-questions.json in the specified
 * directory and combines them into a single questions.json file.
 *
 * Individual files should have the structure:
 * {
 *   "questions": [...]
 * }
 */

const fs = require('fs');
const path = require('path');

function combineQuestions(directory) {
  const absoluteDir = path.resolve(directory);

  if (!fs.existsSync(absoluteDir)) {
    console.error(`Directory not found: ${absoluteDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(absoluteDir);
  const questionFiles = files.filter(f =>
    f.endsWith('-questions.json') ||
    (f.startsWith('round-') && f.endsWith('.json'))
  );

  if (questionFiles.length === 0) {
    console.error('No question files found matching pattern *-questions.json or round-*.json');
    process.exit(1);
  }

  console.log(`Found ${questionFiles.length} question files to combine:`);
  questionFiles.forEach(f => console.log(`  - ${f}`));

  const allQuestions = [];

  for (const file of questionFiles) {
    const filePath = path.join(absoluteDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (data.questions && Array.isArray(data.questions)) {
        allQuestions.push(...data.questions);
        console.log(`  Added ${data.questions.length} questions from ${file}`);
      } else {
        console.warn(`  Warning: ${file} does not have a valid questions array`);
      }
    } catch (err) {
      console.error(`  Error reading ${file}: ${err.message}`);
    }
  }

  const output = {
    questions: allQuestions
  };

  const outputPath = path.join(absoluteDir, 'questions.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2) + '\n');

  console.log(`\nCombined ${allQuestions.length} total questions into ${outputPath}`);

  // Print summary by type
  const byType = allQuestions.reduce((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  console.log('\nQuestion breakdown by type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  // Print summary by book
  const byBook = allQuestions.reduce((acc, q) => {
    acc[q.book_key] = (acc[q.book_key] || 0) + 1;
    return acc;
  }, {});

  console.log('\nQuestion breakdown by book:');
  Object.entries(byBook)
    .sort((a, b) => b[1] - a[1])
    .forEach(([book, count]) => {
      console.log(`  ${book}: ${count}`);
    });
}

const directory = process.argv[2];

if (!directory) {
  console.log('Usage: node scripts/combine-questions.js <directory>');
  console.log('Example: node scripts/combine-questions.js public/obob/2025-2026/6-8/cedar_mill');
  process.exit(1);
}

combineQuestions(directory);
