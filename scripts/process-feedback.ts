#!/usr/bin/env npx tsx

import { readFeedbackSheet, updateFeedbackRow } from '../lib/google-sheets';
import fs from 'fs/promises';
import path from 'path';

interface FeedbackRow {
  rowIndex: number;
  timestamp: string;
  status: string;
  reviewedBy: string;
  feedback: string;
  email: string;
  year: string;
  division: string;
  bookTitle: string;
  bookAuthor: string;
  bookKey: string;
  questionType: string;
  questionText: string;
  page: string;
  answer: string;
  sourceName: string;
  sourceLink: string;
  fixedDate: string;
  correctedQuestionText: string;
  correctedAnswer: string;
  correctedPage: string;
  reviewersNote: string;
}

interface Question {
  type: string;
  text: string;
  answer?: string;
  book_key: string;
  page: number;
  contributor?: string;
}

interface QuestionsFile {
  questions: Question[];
}

interface Source {
  path: string;
  name: string;
  link?: string | null;
}

interface SourcesFile {
  sources: Source[];
}

interface ProcessingResult {
  success: boolean;
  rowIndex: number;
  feedback: string;
  questionText: string;
  sourceName: string;
  error?: string;
  changes?: string;
}

/**
 * Load sources.json to find question file paths
 */
async function loadSources(year: string, division: string): Promise<Source[]> {
  const sourcesPath = path.join(
    process.cwd(),
    'public',
    'obob',
    year,
    division,
    'sources.json'
  );

  try {
    const content = await fs.readFile(sourcesPath, 'utf-8');
    const sourcesFile: SourcesFile = JSON.parse(content);
    return sourcesFile.sources;
  } catch (error) {
    console.error(`❌ Failed to load sources.json for ${year}/${division}:`, error);
    return [];
  }
}

/**
 * Find the questions.json file path for a given source name
 */
function findQuestionFilePath(
  sources: Source[],
  sourceName: string,
  year: string,
  division: string
): string | null {
  const source = sources.find((s) => s.name === sourceName);

  if (!source) {
    return null;
  }

  return path.join(
    process.cwd(),
    'public',
    'obob',
    year,
    division,
    source.path
  );
}

/**
 * Find a matching question in the questions array
 */
function findMatchingQuestion(
  questions: Question[],
  questionText: string,
  bookKey: string,
  page: string
): number {
  const pageNum = parseInt(page, 10);

  return questions.findIndex((q) => {
    // Match on text, book_key, and page
    const textMatch = q.text.trim().toLowerCase() === questionText.trim().toLowerCase();
    const bookMatch = q.book_key === bookKey;
    const pageMatch = q.page === pageNum;

    return textMatch && bookMatch && pageMatch;
  });
}

/**
 * Apply feedback changes to a question based on corrected fields or free-form feedback text
 * Priority: correctedQuestionText, correctedAnswer, and correctedPage fields take precedence over parsing feedback
 */
function applyFeedbackToQuestion(
  question: Question,
  feedback: string,
  correctedQuestionText: string,
  correctedAnswer: string,
  correctedPage: string
): { updated: boolean; changes: string } {
  let updated = false;
  const changes: string[] = [];

  // Priority 1: Use correctedQuestionText if provided
  if (correctedQuestionText && correctedQuestionText.trim() !== '') {
    const newText = correctedQuestionText.trim();
    if (newText !== question.text) {
      changes.push(`Text: "${question.text.substring(0, 50)}..." → "${newText.substring(0, 50)}..."`);
      question.text = newText;
      updated = true;
    }
  }

  // Priority 2: Use correctedAnswer if provided (for content questions)
  if (correctedAnswer && correctedAnswer.trim() !== '' && question.type === 'content') {
    const newAnswer = correctedAnswer.trim();
    if (newAnswer !== question.answer) {
      changes.push(`Answer: "${question.answer}" → "${newAnswer}"`);
      question.answer = newAnswer;
      updated = true;
    }
  }

  // Priority 3: Use correctedPage if provided
  if (correctedPage && correctedPage.trim() !== '') {
    const newPage = parseInt(correctedPage.trim(), 10);
    if (!isNaN(newPage) && newPage !== question.page) {
      changes.push(`Page: ${question.page} → ${newPage}`);
      question.page = newPage;
      updated = true;
    }
  }

  // Priority 4: If no corrected fields, fall back to parsing the feedback text
  if (!correctedQuestionText && !correctedAnswer && !correctedPage) {
    const feedbackLower = feedback.toLowerCase().trim();

    // 1. Page number corrections
    const pageMatch = feedbackLower.match(/(?:page|pg|p\.?)\s*(?:is|should be|:)?\s*(\d+)/i);
    if (pageMatch) {
      const newPage = parseInt(pageMatch[1], 10);
      if (newPage !== question.page) {
        changes.push(`Page: ${question.page} → ${newPage}`);
        question.page = newPage;
        updated = true;
      }
    }

    // 2. Answer corrections (for content questions)
    const answerMatch = feedback.match(/(?:answer|correct answer|should be)(?:\s+is)?:\s*["']?(.+?)["']?$/i);
    if (answerMatch && question.type === 'content') {
      const newAnswer = answerMatch[1].trim();
      if (newAnswer !== question.answer) {
        changes.push(`Answer: "${question.answer}" → "${newAnswer}"`);
        question.answer = newAnswer;
        updated = true;
      }
    }

    // 3. Question text corrections
    const textMatch = feedback.match(/(?:question|text)(?:\s+should be)?:\s*["']?(.+?)["']?$/i);
    if (textMatch) {
      const newText = textMatch[1].trim();
      if (newText !== question.text) {
        changes.push(`Text: "${question.text.substring(0, 50)}..." → "${newText.substring(0, 50)}..."`);
        question.text = newText;
        updated = true;
      }
    }

    // 4. Book key corrections (less common)
    const bookMatch = feedback.match(/(?:book|book_key)(?:\s+is|\s+should be)?:\s*["']?(.+?)["']?$/i);
    if (bookMatch) {
      const newBookKey = bookMatch[1].trim();
      if (newBookKey !== question.book_key) {
        changes.push(`Book: ${question.book_key} → ${newBookKey}`);
        question.book_key = newBookKey;
        updated = true;
      }
    }

    // 5. General corrections - if no specific pattern matched but feedback suggests a change
    // Look for keywords like "wrong", "incorrect", "fix", "change", "update"
    if (!updated && /\b(wrong|incorrect|error|typo|mistake|fix|change|update)\b/i.test(feedbackLower)) {
      // If we can't parse the specific change, note that manual review is needed
      changes.push(`Manual review needed: ${feedback}`);
    }
  }

  return {
    updated,
    changes: changes.length > 0 ? changes.join('; ') : 'No changes applied'
  };
}

/**
 * Process a single feedback row
 */
async function processFeedbackRow(row: FeedbackRow): Promise<ProcessingResult> {
  try {
    // Load sources to find the correct questions.json file
    const sources = await loadSources(row.year, row.division);

    if (sources.length === 0) {
      return {
        success: false,
        rowIndex: row.rowIndex,
        feedback: row.feedback,
        questionText: row.questionText,
        sourceName: row.sourceName,
        error: `No sources found for ${row.year}/${row.division}`
      };
    }

    // Find the question file path
    const questionFilePath = findQuestionFilePath(sources, row.sourceName, row.year, row.division);

    if (!questionFilePath) {
      return {
        success: false,
        rowIndex: row.rowIndex,
        feedback: row.feedback,
        questionText: row.questionText,
        sourceName: row.sourceName,
        error: `Source "${row.sourceName}" not found in sources.json`
      };
    }

    // Load the questions file
    let questionsFile: QuestionsFile;
    try {
      const content = await fs.readFile(questionFilePath, 'utf-8');
      questionsFile = JSON.parse(content);
    } catch (error) {
      return {
        success: false,
        rowIndex: row.rowIndex,
        feedback: row.feedback,
        questionText: row.questionText,
        sourceName: row.sourceName,
        error: `Failed to read questions file: ${questionFilePath}`
      };
    }

    // Find the matching question
    const questionIndex = findMatchingQuestion(
      questionsFile.questions,
      row.questionText,
      row.bookKey,
      row.page
    );

    if (questionIndex === -1) {
      return {
        success: false,
        rowIndex: row.rowIndex,
        feedback: row.feedback,
        questionText: row.questionText,
        sourceName: row.sourceName,
        error: 'Question not found in questions.json (text/book/page mismatch)'
      };
    }

    // Apply feedback to the question
    const question = questionsFile.questions[questionIndex];
    const { updated, changes } = applyFeedbackToQuestion(
      question,
      row.feedback,
      row.correctedQuestionText,
      row.correctedAnswer,
      row.correctedPage
    );

    if (updated) {
      // Write the updated questions file back
      await fs.writeFile(questionFilePath, JSON.stringify(questionsFile, null, 2) + '\n');

      // Update the Google Sheet row
      await updateFeedbackRow(row.rowIndex, {
        status: 'fixed',
        fixedDate: new Date().toISOString()
      });

      return {
        success: true,
        rowIndex: row.rowIndex,
        feedback: row.feedback,
        questionText: row.questionText,
        sourceName: row.sourceName,
        changes
      };
    } else {
      return {
        success: false,
        rowIndex: row.rowIndex,
        feedback: row.feedback,
        questionText: row.questionText,
        sourceName: row.sourceName,
        error: 'Could not interpret feedback - manual review needed'
      };
    }

  } catch (error) {
    return {
      success: false,
      rowIndex: row.rowIndex,
      feedback: row.feedback,
      questionText: row.questionText,
      sourceName: row.sourceName,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Main function to process all reviewed feedback
 */
async function processAllFeedback(): Promise<void> {
  console.log('🚀 Starting to process reviewed feedback from Google Sheet...\n');

  // Read all feedback rows
  const allRows = await readFeedbackSheet();
  console.log(`📊 Found ${allRows.length} total feedback rows`);

  // Filter for feedback with status="reviewed" and reviewedBy set
  const reviewedRows = allRows.filter(
    (row) => row.status.toLowerCase() === 'reviewed' && row.reviewedBy.trim() !== ''
  );

  console.log(`✅ Found ${reviewedRows.length} reviewed feedback rows to process\n`);

  if (reviewedRows.length === 0) {
    console.log('✨ No reviewed feedback to process!');
    return;
  }

  // Process each feedback row
  const results: ProcessingResult[] = [];

  for (const row of reviewedRows) {
    console.log(`\n📝 Processing row ${row.rowIndex}:`);
    console.log(`   Source: ${row.sourceName}`);
    console.log(`   Question: ${row.questionText.substring(0, 60)}...`);
    console.log(`   Feedback: ${row.feedback}`);

    const result = await processFeedbackRow(row as FeedbackRow);
    results.push(result);

    if (result.success) {
      console.log(`   ✅ SUCCESS: ${result.changes}`);
    } else {
      console.log(`   ❌ FAILED: ${result.error}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY\n');

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  console.log(`✅ Successfully processed: ${successCount}`);
  console.log(`❌ Failed to process: ${failCount}`);
  console.log(`📝 Total reviewed: ${results.length}\n`);

  if (successCount > 0) {
    console.log('✅ SUCCESSFULLY UPDATED:\n');
    results
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(`   Row ${r.rowIndex}: ${r.sourceName}`);
        console.log(`   Question: ${r.questionText.substring(0, 60)}...`);
        console.log(`   Changes: ${r.changes}\n`);
      });
  }

  if (failCount > 0) {
    console.log('❌ FAILED TO UPDATE (manual review needed):\n');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   Row ${r.rowIndex}: ${r.sourceName}`);
        console.log(`   Question: ${r.questionText.substring(0, 60)}...`);
        console.log(`   Feedback: ${r.feedback}`);
        console.log(`   Error: ${r.error}\n`);
      });
  }

  console.log('\n✨ Done! Next steps:');
  if (successCount > 0) {
    console.log('  1. Review the changes in the questions.json files');
    console.log('  2. Run: pnpm run build (includes prebuild scripts for counts and exports)');
    console.log('  3. Commit and deploy the changes');
  }
  if (failCount > 0) {
    console.log('  4. Manually review the failed feedback items listed above');
  }
}

// Run the script
processAllFeedback().catch((error) => {
  console.error('❌ Failed to process feedback:', error);
  process.exit(1);
});
