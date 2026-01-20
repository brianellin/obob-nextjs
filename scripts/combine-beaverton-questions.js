#!/usr/bin/env node
/**
 * Combines individual book question JSON files in the beaverton directory
 * into a single questions.json file.
 *
 * Usage: node scripts/combine-beaverton-questions.js
 */

const fs = require('fs');
const path = require('path');

const beavertonDir = path.join(__dirname, '../public/obob/2025-2026/3-5/beaverton');

// Get all JSON files that are NOT questions.json (the individual book files)
const jsonFiles = fs.readdirSync(beavertonDir)
  .filter(file => file.endsWith('.json') && file !== 'questions.json')
  .sort();

console.log(`Found ${jsonFiles.length} book question files:`);
jsonFiles.forEach(file => console.log(`  - ${file}`));

// Combine all questions
let allQuestions = [];
let stats = {
  totalQuestions: 0,
  contentQuestions: 0,
  inWhichBookQuestions: 0,
  byBook: {}
};

for (const file of jsonFiles) {
  const filePath = path.join(beavertonDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const bookKey = file.replace('.json', '');
  const questions = data.questions || [];

  stats.byBook[bookKey] = {
    total: questions.length,
    content: questions.filter(q => q.type === 'content').length,
    inWhichBook: questions.filter(q => q.type === 'in-which-book').length
  };

  stats.totalQuestions += questions.length;
  stats.contentQuestions += stats.byBook[bookKey].content;
  stats.inWhichBookQuestions += stats.byBook[bookKey].inWhichBook;

  allQuestions = allQuestions.concat(questions);
}

// Write combined questions.json
const outputPath = path.join(beavertonDir, 'questions.json');
const output = {
  questions: allQuestions
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log('\n=== Summary ===');
console.log(`Total questions: ${stats.totalQuestions}`);
console.log(`  Content questions: ${stats.contentQuestions}`);
console.log(`  In-which-book questions: ${stats.inWhichBookQuestions}`);
console.log('\nBy book:');
for (const [bookKey, bookStats] of Object.entries(stats.byBook)) {
  console.log(`  ${bookKey}: ${bookStats.total} (${bookStats.content} content, ${bookStats.inWhichBook} in-which-book)`);
}

console.log(`\nOutput written to: ${outputPath}`);
