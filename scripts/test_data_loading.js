#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

// Quick test script to check if the 2025-2026 data loads correctly
const fs = require('fs');
const path = require('path');

function testDataLoading(year, division) {
  console.log(`\n=== Testing ${year}/${division} ===`);
  
  try {
    // Test books.json
    const booksPath = path.join(__dirname, '..', 'public', 'obob', year, division, 'books.json');
    const booksData = JSON.parse(fs.readFileSync(booksPath, 'utf8'));
    const books = Object.values(booksData.books);
    console.log(`✅ Books loaded: ${books.length} books`);
    
    // Test sources.json
    const sourcesPath = path.join(__dirname, '..', 'public', 'obob', year, division, 'sources.json');
    const sourcesData = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
    console.log(`✅ Sources loaded: ${sourcesData.sources.length} sources`);
    
    // Test each questions file
    let totalQuestions = 0;
    for (const source of sourcesData.sources) {
      const questionsPath = path.join(__dirname, '..', 'public', 'obob', year, division, source.path);
      try {
        const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        const questionCount = questionsData.questions.length;
        totalQuestions += questionCount;
        console.log(`✅ ${source.name}: ${questionCount} questions`);
        
        // Check question structure
        if (questionCount > 0) {
          const firstQuestion = questionsData.questions[0];
          const requiredFields = ['type', 'text', 'book_key'];
          const missingFields = requiredFields.filter(field => !firstQuestion[field]);
          if (missingFields.length > 0) {
            console.log(`⚠️  Missing fields in first question: ${missingFields.join(', ')}`);
          }
        }
      } catch (error) {
        console.log(`❌ Failed to load ${source.path}: ${error.message}`);
      }
    }
    
    console.log(`📊 Total questions: ${totalQuestions}`);
    
    // Test book coverage
    const questionsByBook = {};
    for (const source of sourcesData.sources) {
      const questionsPath = path.join(__dirname, '..', 'public', 'obob', year, division, source.path);
      try {
        const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
        questionsData.questions.forEach(q => {
          if (q.book_key) {
            questionsByBook[q.book_key] = (questionsByBook[q.book_key] || 0) + 1;
          }
        });
      } catch (error) {
        // Already logged above
      }
    }
    
    console.log(`📚 Books with questions: ${Object.keys(questionsByBook).length}/${books.length}`);
    
    // Check for books without questions
    const booksWithoutQuestions = books.filter(book => !questionsByBook[book.book_key]);
    if (booksWithoutQuestions.length > 0) {
      console.log(`⚠️  Books without questions: ${booksWithoutQuestions.map(b => b.book_key).join(', ')}`);
    }
    
  } catch (error) {
    console.log(`❌ Error testing ${year}/${division}: ${error.message}`);
  }
}

// Test all combinations
const combinations = [
  ['2024-2025', '3-5'],
  ['2024-2025', '6-8'],
  ['2025-2026', '3-5'],
  ['2025-2026', '6-8'],
  ['2025-2026', '9-12']
];

console.log('🔍 Testing OBOB data loading...');

for (const [year, division] of combinations) {
  testDataLoading(year, division);
}

console.log('\n✅ Data loading test complete!');
