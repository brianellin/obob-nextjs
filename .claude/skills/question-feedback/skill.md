---
description: Process reviewed question feedback from Google Sheets and automatically update questions.json files
---

# Question Feedback Processing Skill

You are a specialized skill designed to help process reviewed question feedback for the OBOB.dog project.

## Your Purpose

Users submit feedback about incorrect or problematic questions via the website. Reviewers examine this feedback in a Google Sheet and mark items as reviewed. Your job is to:

1. Read reviewed feedback from the Google Sheet
2. Find the corresponding questions in the questions.json files
3. Interpret the feedback and apply appropriate updates
4. Mark the feedback as "fixed" in the sheet
5. Provide a summary report of all changes

## How to Execute

When the user asks you to process feedback, follow these steps:

### Step 1: Run the Processing Script

Execute the feedback processing script:

```bash
pnpm run process-feedback
```

This script will:
- Read all feedback rows from the Google Sheet where `reviewedBy` is not empty
- Filter out rows that are already marked as `fixed`
- For each reviewed feedback:
  - Find the correct questions.json file using year/division/source
  - Locate the matching question by text, book key, and page number
  - Interpret the free-form feedback text to determine what needs updating
  - Apply updates to the question (page, answer, text, etc.)
  - Update the sheet row with `status='fixed'` and `fixedDate`
- Generate a detailed summary report

### Step 2: Review the Output

The script will output:
- Progress for each feedback item being processed
- A summary showing:
  - Successfully updated questions with details of changes
  - Failed updates that need manual review
  - Statistics on success/failure rates

### Step 3: Present Results to User

Provide the user with:
- A clear summary of what was updated
- The number of successful vs failed updates
- Details of any questions that need manual review
- Recommendations for next steps

### Step 4: Offer Next Actions

After processing, offer to help with:
- Reviewing the git diff to see what changed
- Running the build process (`pnpm run build`) to regenerate counts and exports
- Creating a commit with the changes
- Manually fixing any feedback items that couldn't be auto-processed

## Understanding Feedback Interpretation

The script uses pattern matching and AI interpretation to understand feedback like:

- **Page corrections**: "page is 145", "should be on page 23", "pg. 67"
- **Answer corrections**: "answer: correct text here", "answer should be: new answer"
- **Question text fixes**: "question: new question text here"
- **Book key changes**: "book: different-book-key"
- **General errors**: Feedback with keywords like "wrong", "incorrect", "typo", "mistake"

If the script can't interpret the feedback, it will mark it as needing manual review.

## Important Notes

- **Matching Logic**: Questions are matched by exact text, book_key, and page number
- **Status Updates**: Only processes rows where `reviewedBy` is non-empty and `status != 'fixed'`
- **Sheet Updates**: Successfully processed feedback gets `status='fixed'` and a timestamp in `fixedDate`
- **Failed Updates**: Skipped items remain in the sheet for manual review

## Error Handling

Common issues you might encounter:

1. **Question not found**: Text/book/page doesn't match exactly
   - Solution: User needs to manually locate and fix the question

2. **Source not found**: sourceName doesn't match any entry in sources.json
   - Solution: Check if source name changed or was misspelled

3. **Feedback unclear**: Can't parse what needs to be changed
   - Solution: Needs manual review and more specific feedback

## Example Interaction

**User**: "Process the reviewed feedback"

**You**:
"I'll process the reviewed question feedback from the Google Sheet.

*Running the feedback processing script...*

**Summary:**
✅ Successfully updated: 8 questions
❌ Failed to process: 2 questions (need manual review)

**Successfully Updated:**
- Row 45: Changed page from 123 to 125 (Cedar Mill Public Library)
- Row 52: Updated answer to "Mr. Tushman" (Lake Oswego Public Library)
- Row 63: Fixed typo in question text (OBOB Parent Group)
[...5 more...]

**Needs Manual Review:**
- Row 71: Question not found (text may have changed)
- Row 88: Unclear feedback: "this is wrong" (needs more specific instructions)

**Next Steps:**
1. Would you like me to show you the git diff of what changed?
2. I can run the build process to regenerate counts and exports
3. I can help you manually fix the 2 items that need review"

## Technical Details

### Files Involved

- **Script**: `scripts/process-feedback.ts`
- **Google Sheets Library**: `lib/google-sheets.ts` (functions: `readFeedbackSheet`, `updateFeedbackRow`)
- **Questions Files**: `public/obob/{year}/{division}/{source}/questions.json`
- **Sources Files**: `public/obob/{year}/{division}/sources.json`

### Data Flow

1. Google Sheet → `readFeedbackSheet()` → Array of feedback rows
2. For each row: Load sources.json → Find questions.json path
3. Load questions.json → Find matching question
4. Apply feedback → Update question object
5. Save questions.json → Update sheet status → Report results

### Environment Variables Required

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_FEEDBACK_SHEET_ID`

These should already be configured in your `.env.local` file.

## Tips for Success

1. **Always review changes**: Use `git diff` before committing
2. **Run build after updates**: Counts and exports need regeneration
3. **Be specific with feedback**: When marking manual items, provide clear instructions
4. **Batch processing**: Process multiple feedback items at once for efficiency
5. **Verify in production**: Test a few updated questions on the live site

## When to Use This Skill

Invoke this skill when the user says things like:
- "Process the reviewed feedback"
- "Update questions from the feedback sheet"
- "Apply the feedback changes"
- "Fix the questions that were reviewed"
- "Run the question feedback skill"

You are designed to make the feedback processing workflow efficient and automated while providing clear visibility into what changes were made.
