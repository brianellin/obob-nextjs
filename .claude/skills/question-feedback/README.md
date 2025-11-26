# Question Feedback Skill

A Claude Code skill that automates the processing of reviewed question feedback from Google Sheets.

## Overview

This skill helps automate the workflow of fixing questions based on user feedback. Users submit feedback via the OBOB.dog website, reviewers mark items as reviewed in a Google Sheet, and this skill automatically applies the fixes to the questions.json files.

## What It Does

1. **Reads feedback** from the Google Sheet (all rows where `reviewedBy` is not empty)
2. **Finds questions** in the appropriate questions.json files using year/division/source
3. **Interprets feedback** using pattern matching and AI to determine what needs updating
4. **Applies changes** to question fields (page, answer, text, book_key)
5. **Updates the sheet** with `status='fixed'` and `fixedDate` timestamp
6. **Generates a report** showing successful updates and items needing manual review

## Installation

The skill is already set up! No additional installation needed.

## Usage

### Invoke the Skill

In Claude Code, simply say:
```
Process the reviewed feedback
```

Or:
```
Run the question feedback skill
```

### What Happens

The skill will:
1. Run `pnpm run process-feedback` to execute the processing script
2. Show you real-time progress as each feedback item is processed
3. Present a summary of:
   - Successfully updated questions with details of changes
   - Failed updates that need manual review
   - Statistics and next steps

### Example Output

```
🚀 Starting to process reviewed feedback from Google Sheet...

📊 Found 47 total feedback rows
✅ Found 12 reviewed feedback rows to process

📝 Processing row 45:
   Source: Cedar Mill Public Library
   Question: In which book does a character discover a hidden room?
   Feedback: page is 125, not 123
   ✅ SUCCESS: Page: 123 → 125

[...more processing...]

📊 SUMMARY

✅ Successfully processed: 10
❌ Failed to process: 2
📝 Total reviewed: 12

✅ SUCCESSFULLY UPDATED:
   Row 45: Cedar Mill Public Library
   Question: In which book does a character discover a hidden room?
   Changes: Page: 123 → 125
   [...]

❌ FAILED TO UPDATE (manual review needed):
   Row 71: Lake Oswego Public Library
   Question: What color was the mysterious box?
   Feedback: this is wrong
   Error: Could not interpret feedback - manual review needed
```

## How It Works

### Feedback Interpretation

The script understands various feedback formats:

| Feedback Type | Example | What It Does |
|--------------|---------|--------------|
| Page corrections | "page is 145", "pg. 67" | Updates the page number |
| Answer corrections | "answer: new answer text" | Updates the answer field |
| Question text fixes | "question: corrected text" | Updates the question text |
| Book corrections | "book: different-book-key" | Updates the book_key |
| General errors | "typo in answer", "incorrect" | Flags for manual review |

### Matching Logic

Questions are matched by **exact** comparison of:
- Question text (case-insensitive)
- Book key
- Page number

All three must match exactly, or the question won't be found.

### Status Management

| Status | Meaning |
|--------|---------|
| `pending` | New feedback, not yet reviewed |
| `reviewed` (with reviewedBy) | Reviewed by a human, ready to process |
| `fixed` | Successfully processed by this skill |

The skill only processes rows where:
- `reviewedBy` is not empty AND
- `status != 'fixed'`

## Files Modified

When you run this skill, it modifies:

1. **Questions files**: `public/obob/{year}/{division}/{source}/questions.json`
   - Updates question objects based on feedback

2. **Google Sheet**: The feedback sheet row
   - Sets `status='fixed'`
   - Adds `fixedDate` timestamp

## Next Steps After Processing

The skill will prompt you to:

1. **Review changes**: Use `git diff` to see what was modified
2. **Run build**: Execute `pnpm run build` to regenerate counts and exports
3. **Commit changes**: Create a git commit with the updates
4. **Manual fixes**: Address any feedback items that failed to auto-process

## Troubleshooting

### Question Not Found

**Problem**: "Question not found in questions.json (text/book/page mismatch)"

**Solutions**:
- Check if the question text in the sheet matches exactly
- Verify the page number is correct
- Confirm the book_key matches
- The question may have already been modified

### Source Not Found

**Problem**: "Source not found in sources.json"

**Solutions**:
- Check the `sourceName` in the feedback sheet
- Compare with source names in `public/obob/{year}/{division}/sources.json`
- The source name may have changed or been misspelled

### Could Not Interpret Feedback

**Problem**: "Could not interpret feedback - manual review needed"

**Solutions**:
- Provide more specific feedback in the sheet (e.g., "page: 125" instead of "this is wrong")
- Use structured formats like "answer: correct text here"
- Some complex changes may require manual editing

## Technical Details

### Architecture

```
┌─────────────────┐
│  Google Sheet   │ reviewedBy column filled
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ readFeedbackSheet()
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Find Question  │ year/division/source → questions.json
│   in Files      │ match by text/book/page
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Interpret       │ Pattern matching + AI
│  Feedback       │ Extract: page/answer/text changes
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Apply Changes   │ Update questions.json
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ Update Sheet    │ status='fixed', fixedDate=timestamp
└─────────────────┘
```

### Key Functions

**Google Sheets Library** (`lib/google-sheets.ts`):
- `readFeedbackSheet()` - Fetch all feedback rows
- `updateFeedbackRow(rowIndex, updates)` - Update a specific row

**Processing Script** (`scripts/process-feedback.ts`):
- `loadSources()` - Load sources.json to find question file paths
- `findQuestionFilePath()` - Map source name to questions.json path
- `findMatchingQuestion()` - Match question by text/book/page
- `applyFeedbackToQuestion()` - Interpret and apply feedback changes
- `processFeedbackRow()` - Full processing pipeline for one row
- `processAllFeedback()` - Main entry point, processes all reviewed feedback

### Environment Variables

Required in `.env.local`:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_FEEDBACK_SHEET_ID`

## Development

### Running Manually

You can also run the processing script directly:

```bash
pnpm run process-feedback
```

### Testing with Sample Data

To test with a single feedback item:

1. Add a test row to the Google Sheet
2. Fill in all required fields (year, division, bookKey, etc.)
3. Set `reviewedBy` to your name
4. Run the skill or script
5. Check the questions.json file and sheet for updates

### Extending the Skill

To add new feedback interpretation patterns, edit `scripts/process-feedback.ts` in the `applyFeedbackToQuestion()` function. Common additions:

- New regex patterns for feedback formats
- Additional question fields to update
- Custom validation logic

## Best Practices

1. **Review before committing**: Always check `git diff` to verify changes
2. **Specific feedback**: Encourage reviewers to use structured feedback formats
3. **Batch processing**: Process multiple feedback items at once
4. **Run tests**: Execute `pnpm test` after updates to verify data integrity
5. **Regenerate assets**: Always run `pnpm run build` after making changes

## Support

For issues or questions:
- Check the skill.md file for detailed instructions
- Review the processing script logs for error details
- Manually inspect the questions.json files if needed
- Ask Claude Code for help interpreting errors

## Changelog

### v1.0.0 (2025-11-26)
- Initial release
- Supports page, answer, text, and book_key updates
- Automatic pattern matching for common feedback formats
- Google Sheets integration with status updates
- Comprehensive error handling and reporting
