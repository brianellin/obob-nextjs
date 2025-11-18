#!/usr/bin/env npx tsx

import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs/promises';
import path from 'path';

interface SheetRow {
  timestamp: string;
  status: string;
  year: string;
  division: string;
  bookKey: string;
  questionType: string;
  questionText: string;
  page: string;
  answer?: string;
  sourceName: string;
  sourceLink?: string;
  sourceEmail: string;
}

interface Question {
  type: string;
  text: string;
  answer?: string;
  book_key: string;
  page: number;
  contributor: string;
}

interface QuestionsFile {
  questions: Question[];
}

/**
 * Convert full name to "FirstName L." format
 */
function formatContributorName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fullName;

  const firstName = parts[0];
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() : '';

  return lastInitial ? `${firstName} ${lastInitial}.` : firstName;
}

/**
 * Load the Google Sheet and return reviewed questions
 */
async function loadReviewedQuestions(): Promise<SheetRow[]> {
  const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
  ];

  const jwt = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_QUESTION_SHEET_ID!, jwt);
  await doc.loadInfo();

  console.log(`📄 Connected to sheet: ${doc.title}`);

  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();

  console.log(`📊 Found ${rows.length} total rows`);

  // Filter for reviewed questions
  const reviewedRows = rows
    .filter(row => row.get('status')?.toLowerCase() === 'reviewed')
    .map(row => ({
      timestamp: row.get('timestamp') || '',
      status: row.get('status') || '',
      year: row.get('year') || '',
      division: row.get('division') || '',
      bookKey: row.get('bookKey') || '',
      questionType: row.get('questionType') || '',
      questionText: row.get('questionText') || '',
      page: row.get('page') || '0',
      answer: row.get('answer') || undefined,
      sourceName: row.get('sourceName') || '',
      sourceLink: row.get('sourceLink') || '',
      sourceEmail: row.get('sourceEmail') || '',
    }));

  console.log(`✅ Found ${reviewedRows.length} reviewed questions`);

  return reviewedRows;
}

/**
 * Add questions to the appropriate division's obobdog_community questions.json
 */
async function addQuestionsToFile(year: string, division: string, newQuestions: Question[]): Promise<void> {
  const questionsPath = path.join(
    process.cwd(),
    'public',
    'obob',
    year,
    division,
    'obobdog_community',
    'questions.json'
  );

  let questionsFile: QuestionsFile;

  try {
    const content = await fs.readFile(questionsPath, 'utf-8');
    questionsFile = JSON.parse(content);
  } catch (error) {
    console.log(`⚠️  Creating new questions file at ${questionsPath}`);
    questionsFile = { questions: [] };

    // Ensure directory exists
    const dir = path.dirname(questionsPath);
    await fs.mkdir(dir, { recursive: true });
  }

  // Add new questions
  const beforeCount = questionsFile.questions.length;
  questionsFile.questions.push(...newQuestions);
  const afterCount = questionsFile.questions.length;

  // Write back to file with proper formatting
  await fs.writeFile(questionsPath, JSON.stringify(questionsFile, null, 2) + '\n');

  console.log(`  ✅ Added ${afterCount - beforeCount} questions to ${year}/${division}/obobdog_community`);
  console.log(`     Total questions now: ${afterCount}`);
}

/**
 * Main function to process reviewed questions
 */
async function processReviewedQuestions(): Promise<void> {
  console.log('🚀 Starting to process reviewed questions from Google Sheet...\n');

  // Load reviewed questions from sheet
  const reviewedRows = await loadReviewedQuestions();

  if (reviewedRows.length === 0) {
    console.log('\n✨ No reviewed questions to process!');
    return;
  }

  // Group questions by year and division
  const groupedQuestions = new Map<string, Question[]>();
  const emailsToNotify = new Set<string>();

  for (const row of reviewedRows) {
    const key = `${row.year}/${row.division}`;

    if (!groupedQuestions.has(key)) {
      groupedQuestions.set(key, []);
    }

    const question: Question = {
      type: row.questionType,
      text: row.questionText,
      book_key: row.bookKey,
      page: parseInt(row.page, 10) || 0,
      contributor: formatContributorName(row.sourceName),
    };

    // Only add answer field for "content" type questions
    if (row.questionType === 'content' && row.answer) {
      question.answer = row.answer;
    }

    groupedQuestions.get(key)!.push(question);

    // Track email for notification
    if (row.sourceEmail) {
      emailsToNotify.add(row.sourceEmail);
    }
  }

  // Add questions to their respective files
  console.log('\n📝 Adding questions to files...\n');

  for (const [key, questions] of groupedQuestions) {
    const [year, division] = key.split('/');
    await addQuestionsToFile(year, division, questions);
  }

  // Display emails to notify
  console.log('\n📧 Emails to notify:\n');
  const sortedEmails = Array.from(emailsToNotify).sort();

  if (sortedEmails.length === 0) {
    console.log('  (No emails found)');
  } else {
    sortedEmails.forEach(email => {
      console.log(`  • ${email}`);
    });
  }

  // Summary
  console.log('\n📊 Summary:\n');
  console.log(`  Total reviewed questions processed: ${reviewedRows.length}`);
  console.log(`  Divisions updated: ${groupedQuestions.size}`);
  console.log(`  Contributors to notify: ${emailsToNotify.size}`);

  console.log('\n✨ Done! Remember to:');
  console.log('  1. Review the changes in the questions.json files');
  console.log('  2. Run the build scripts to regenerate counts and exports');
  console.log('  3. Update the Google Sheet status for processed questions');
  console.log('  4. Send notification emails to the contributors listed above');
}

// Run the script
processReviewedQuestions().catch((error) => {
  console.error('❌ Failed to process reviewed questions:', error);
  process.exit(1);
});
