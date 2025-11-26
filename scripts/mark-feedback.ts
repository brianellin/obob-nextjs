#!/usr/bin/env npx tsx

import { readFeedbackSheet, updateFeedbackRow } from '../lib/google-sheets';

interface MarkFeedbackOptions {
  bookKey: string;
  page: string;
  questionText?: string;
  status: 'fixed' | "won't-fix";
  reviewersNote: string;
}

/**
 * Mark a feedback item with a specific status and reviewer note
 * Usage: npx tsx scripts/mark-feedback.ts --bookKey="odder" --page="217" --status="fixed" --note="Fixed typo"
 */
async function markFeedback(options: MarkFeedbackOptions) {
  const allFeedback = await readFeedbackSheet();

  // Find the feedback row matching the criteria
  const targetFeedback = allFeedback.find(row => {
    const bookMatch = row.bookKey === options.bookKey;
    const pageMatch = row.page === options.page;
    const questionMatch = !options.questionText || row.questionText?.includes(options.questionText);

    return bookMatch && pageMatch && questionMatch;
  });

  if (!targetFeedback) {
    console.log('Could not find feedback row matching criteria:');
    console.log(`  Book Key: ${options.bookKey}`);
    console.log(`  Page: ${options.page}`);
    if (options.questionText) {
      console.log(`  Question Text: ${options.questionText}`);
    }
    return;
  }

  console.log(`Found feedback row: ${targetFeedback.rowIndex}`);
  console.log(`  Question: ${targetFeedback.questionText}`);
  console.log(`  Current feedback: ${targetFeedback.feedback}`);
  console.log(`  Current status: ${targetFeedback.status}`);

  // Prepare the update
  const updates: Record<string, string> = {
    status: options.status,
    reviewedBy: 'Brian',
    reviewedDate: new Date().toISOString().split('T')[0],
    reviewersNote: options.reviewersNote,
  };

  // Add fixedDate if status is 'fixed'
  if (options.status === 'fixed') {
    updates.fixedDate = new Date().toISOString().split('T')[0];
  }

  await updateFeedbackRow(targetFeedback.rowIndex, updates);

  console.log(`\n✅ Marked as '${options.status}' in Google Sheet`);
  console.log(`   Reviewer note: ${options.reviewersNote}`);
}

// Parse command line arguments
function parseArgs(): MarkFeedbackOptions | null {
  const args = process.argv.slice(2);
  const options: Partial<MarkFeedbackOptions> = {};

  for (const arg of args) {
    const [key, value] = arg.split('=');
    const cleanKey = key.replace(/^--/, '');
    const cleanValue = value?.replace(/^["']|["']$/g, ''); // Remove quotes

    if (cleanKey === 'bookKey') options.bookKey = cleanValue;
    else if (cleanKey === 'page') options.page = cleanValue;
    else if (cleanKey === 'questionText') options.questionText = cleanValue;
    else if (cleanKey === 'status') options.status = cleanValue as 'fixed' | "won't-fix";
    else if (cleanKey === 'note') options.reviewersNote = cleanValue;
  }

  // Validate required fields
  if (!options.bookKey || !options.page || !options.status || !options.reviewersNote) {
    console.error('Missing required arguments!');
    console.error('Usage: npx tsx scripts/mark-feedback.ts --bookKey="book-key" --page="123" --status="fixed" --note="Description of fix"');
    console.error('Optional: --questionText="partial question text to match"');
    console.error('Status must be either "fixed" or "won\'t-fix"');
    return null;
  }

  return options as MarkFeedbackOptions;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  if (options) {
    markFeedback(options).catch(console.error);
  }
}

export { markFeedback };
export type { MarkFeedbackOptions };
