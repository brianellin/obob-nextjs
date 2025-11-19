# Question Selection Randomness Tests

This document explains the randomness tests added to verify proper book distribution in question selection.

## Background

A bug was reported where selecting 16 books in friend battle mode resulted in all content questions coming from the same book. These tests were created to catch and prevent such randomness issues.

## Test File

`tests/question-randomness.test.ts`

## What These Tests Check

### 1. **Content Questions - Book Distribution**
- Verifies content questions are distributed randomly across all selected books
- Tests with 4, 16, and variable numbers of books
- Ensures no single book dominates the selection

### 2. **In-Which-Book Questions - Book Distribution**
- Validates IWB questions are spread across books
- Tests with 8 and 16 book selections
- Confirms all books have fair representation

### 3. **Both Question Types - Book Distribution**
- Tests the "both" mode (mixing IWB and content questions)
- Validates distribution with 4, 8, and 16 books
- Specific focus on the 16-book friend battle scenario

### 4. **Type-Specific Distribution within "Both" Mode**
- Ensures content questions don't all come from the same book
- Verifies IWB and content questions use different book sets
- Checks that content questions aren't over-filtered based on IWB selection
- Critical regression test for the reported bug

### 5. **Statistical Randomness**
- Validates different question selections across multiple runs
- Ensures the shuffle algorithm is working properly
- Confirms distribution patterns are consistent but not identical

### 6. **Regression Tests for 16-Book Bug**
- Specific tests targeting the reported issue
- Ensures content questions come from at least 50% of available books
- Verifies IWB and content questions don't have problematic overlap
- Tracks book coverage across multiple trials

## Key Assertions

### Distribution Tests
- **Book Coverage**: All books should appear in questions across multiple trials
- **Even Distribution**: Questions per book should differ by at most 1-2 questions
- **Chi-Squared Test**: Statistical measure of distribution randomness

### Regression Tests (16-Book Scenario)
- Content questions must come from **multiple books** (not just 1)
- At least **50% of books** should be represented in content questions
- Content books should not be a complete subset of IWB books
- Across 50 trials, at least **80% of books** should appear in content questions

## Test Methodology

### Mock Question Generation
Tests use `createMockQuestion()` and `createQuestionPool()` helpers to generate consistent test data without relying on actual question files.

### Statistical Analysis
- **Chi-Squared Test**: Measures if observed distribution matches expected even distribution
- **Coverage Analysis**: Tracks which books appear across multiple runs
- **Imbalance Metrics**: Measures max-min difference in questions per book

### Trial-Based Testing
Most tests run 20-100 trials to ensure randomness is consistent, not just a one-time occurrence.

## Running the Tests

```bash
# Run only randomness tests
pnpm test tests/question-randomness.test.ts

# Run all tests
pnpm test
```

## Expected Behavior

✅ **Good**: Questions evenly distributed across all selected books
✅ **Good**: Different selections on each run (due to shuffle)
✅ **Good**: All books represented fairly across multiple trials

❌ **Bad**: All content questions from one book
❌ **Bad**: Some books never selected despite being available
❌ **Bad**: Heavy bias toward certain books

## Related Code

- **Selection Logic**: `lib/questions.ts` - `selectQuestions()` and `selectDistributedQuestions()`
- **API Route**: `app/api/questions/battle/route.ts`
- **Question Types**: See `types.ts` for Question interface

## Future Improvements

These tests could be extended to:
- Test with real question data from the database
- Add performance benchmarks for selection speed
- Test edge cases with very small question pools
- Verify randomness across different divisions/years
