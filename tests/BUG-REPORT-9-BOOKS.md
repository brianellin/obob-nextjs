# Bug Report: All Content Questions from One Book (9-Book Scenario)

## Status: ✅ **BUG CONFIRMED AND REPRODUCED**

## Summary

When selecting **9 books** with **16 questions** in "both" mode (friend battle), **ALL content questions come from a single book** 100% of the time, while IWB questions are properly distributed across 8 different books.

## Reproduction

The bug was successfully reproduced in automated tests with **100% failure rate** (50/50 trials failed).

### Test Command
```bash
pnpm test tests/question-randomness.test.ts
```

### Test That Catches the Bug
- **Test**: "should not have all content questions from one book with 9 books selected (reported bug)"
- **Location**: `tests/question-randomness.test.ts:479`
- **Result**: Failed 50/50 trials

## Bug Evidence

Every trial showed the same pattern:
```
Trial 0: ALL 8 content questions from book5!
         IWB questions used 8 books: book1, book6, book4, book3, book9, book8, book2, book7

Trial 1: ALL 8 content questions from book1!
         IWB questions used 8 books: book6, book8, book7, book2, book5, book9, book4, book3

Trial 2: ALL 8 content questions from book1!
         IWB questions used 8 books: book6, book4, book3, book2, book9, book5, book7, book8
```

**Pattern**:
- ✅ IWB questions: Always distributed across **8 different books**
- ❌ Content questions: Always from **exactly 1 book**

## Root Cause Analysis

### The Bug Trigger

Looking at `lib/questions.ts:135-169`, specifically the "both" mode logic:

```typescript
if (type === "both") {
  // Line 144: Split questions 50/50
  const halfCount = Math.ceil(count / 2);  // With 16 questions: halfCount = 8
  const iwbCount = Math.min(halfCount, iwbQuestions.length);     // iwbCount = 8
  const contentCount = Math.min(halfCount, contentQuestions.length); // contentCount = 8

  // Line 149: Select IWB questions first
  const selectedIwb = selectDistributedQuestions(iwbQuestions, iwbCount);

  // Line 152-157: THE BUG IS HERE
  const usedBooks = new Set(selectedIwb.map(q => q.book_key));  // 8 books used
  let remainingContentQuestions = contentQuestions;

  if (contentCount <= usedBooks.size) {  // 8 <= 8 → TRUE ❌
    // Filter out all books used in IWB questions
    remainingContentQuestions = contentQuestions.filter(q => !usedBooks.has(q.book_key));
  }

  // Line 159-161: Fallback if not enough questions
  if (remainingContentQuestions.length < contentCount) {
    remainingContentQuestions = contentQuestions; // Reset to all content questions
  }

  // Line 163: Select content questions
  const selectedContent = selectDistributedQuestions(remainingContentQuestions, contentCount);
}
```

### Why It Fails with 9 Books

**Scenario**: 9 books, 16 questions (8 IWB + 8 content)

1. **Step 1**: `selectDistributedQuestions` selects 8 IWB questions
   - With 9 books and 8 questions needed, typically uses 8 different books
   - `usedBooks.size = 8`

2. **Step 2**: Check filtering condition
   - `contentCount (8) <= usedBooks.size (8)` → **TRUE** ✅
   - This triggers filtering: remove all books used for IWB

3. **Step 3**: Filter content questions
   - Only 1 book remains (the one not used for IWB)
   - All content questions now come from that single book

4. **Step 4**: Fallback check
   - `remainingContentQuestions.length < contentCount` → **TRUE** (probably)
   - Resets to all content questions, **BUT** `selectDistributedQuestions` might still have issues

5. **Step 5**: Selection from limited pool
   - Even after reset, the algorithm seems to consistently select from one book

### Why 16 Books Doesn't Show the Bug (in our tests)

With 16 books and 16 questions (8 IWB + 8 content):
- IWB questions use ~8 books (out of 16 available)
- After filtering, 8 books remain for content questions
- Enough diversity remains for proper distribution

## Impact

**Severity**: HIGH

- Affects friend battle mode (most common use case)
- Completely breaks randomness for content questions
- Creates unfair quiz experience (all content from one book)
- Occurs **100% of the time** with 9 books selected

## Tests Created

Three new tests specifically for the 9-book scenario:

1. ✅ **Main regression test** - Detects 100% bug occurrence rate
2. ✅ **Varying question densities** - Tests real-world data distribution
3. ✅ **Limited content questions** - Edge case with few questions per book

## Next Steps

1. Fix the filtering logic in `lib/questions.ts:155-161`
2. Consider removing or adjusting the book filtering heuristic
3. Run all tests to ensure fix doesn't break other scenarios
4. Test with real question data from database

## Related Files

- **Bug Location**: `lib/questions.ts:155-161`
- **Test File**: `tests/question-randomness.test.ts:479-515`
- **API Route**: `app/api/questions/battle/route.ts` (calls `selectQuestions`)
