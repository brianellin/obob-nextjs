# Bug Scenarios Discovered Through Testing

## Overview

Testing revealed that the filtering bug affects **multiple book count scenarios**, not just the reported 9-book case. The bug occurs whenever the filtering condition `contentCount <= usedBooks.size` is triggered.

## Test Results Summary

**Total Tests**: 35 randomness tests
**Passing**: 28 tests ✅
**Failing**: 7 tests ❌

## Failing Scenarios (Bug Confirmed)

### 1. ❌ 9 Books, 16 Questions (Original Report)
- **Test**: "should not have all content questions from one book with 9 books selected"
- **Books**: 9
- **Questions**: 16 (8 IWB + 8 content)
- **Failure Rate**: 100% (50/50 trials)
- **Result**: ALL content questions from 1 book
- **Why**: `contentCount (8) <= usedBooks.size (8)` triggers filtering, leaves only 1 book

### 2. ❌ 9 Books with Varying Question Densities
- **Test**: "should distribute content questions across books with 9 books and varying question densities"
- **Books**: 9
- **Questions**: 16
- **Content per book**: Varies (10-20 questions)
- **Result**: Only 1 unique content book
- **Why**: Same filtering issue, regardless of question density

### 3. ❌ Exact Boundary Scenarios
- **Test**: "should handle exact boundary: contentCount == usedBooks.size"
- **Scenarios tested**:
  - **5 books, 8 questions** → FAILS (1 content book)
  - **7 books, 12 questions** → FAILS (1 content book)
  - **9 books, 16 questions** → FAILS (1 content book)
  - **11 books, 20 questions** → FAILS (1 content book)
- **Pattern**: Any scenario where `contentCount == usedBooks.size` fails

### 4. ❌ Off-By-One Boundaries
- **Test**: "should handle off-by-one boundaries: contentCount == usedBooks.size ± 1"
- **Scenarios**:
  - 8 books, 16 questions
  - 10 books, 16 questions
  - 6 books, 10 questions
- **Result**: Bug occurs in some trials
- **Why**: Randomness in book selection sometimes hits the boundary condition

### 5. ❌ Uneven Question Distribution
- **Test**: "should handle uneven question distribution per book"
- **Books**: 9
- **Setup**: Books have 5-29 IWB questions, 3-19 content questions
- **Result**: Only 1 content book
- **Why**: Filtering still applies regardless of distribution

### 6. ❌ One Book Without Content Questions
- **Test**: "should handle when one book has no content questions"
- **Books**: 9 (one has 0 content questions)
- **Result**: Only 1 content book
- **Why**: Bug still occurs with sparse data

### 7. ❌ Odd Question Counts
- **Test**: "should handle odd question counts (15, 17, 19, 21)"
- **Books**: 9
- **Question counts**: 15, 17, 19, 21
- **Result**: Only 1 content book for multiple odd counts
- **Why**: Ceiling division still triggers boundary condition

## Passing Scenarios (Bug NOT Present)

### ✅ Scenarios That Work Correctly

1. **4 books, 16 questions** - Works (minimum book requirement)
2. **5 books, 16 questions** - Works (enough diversity after filtering)
3. **6 books, 12 questions** - Works
4. **7 books, 20 questions** - Works
5. **8 books, both mode** - Works
6. **10 books, 16 questions** - Works (enough books remain)
7. **12 books, 8 questions** - Works (small question count)
8. **16 books, 16 questions** - Works (plenty of books)

### Why These Work

These scenarios avoid the bug because:
- **More books than needed**: After filtering, enough books remain (e.g., 16 books → 8 used for IWB → 8 remain)
- **Fewer questions**: `contentCount < usedBooks.size` so filtering doesn't trigger
- **Content-only mode**: No IWB filtering occurs

## The Critical Boundary

### Bug Trigger Condition

```typescript
if (contentCount <= usedBooks.size) {
  // Filter out books used for IWB
  remainingContentQuestions = contentQuestions.filter(q => !usedBooks.has(q.book_key));
}
```

### When This Causes Problems

**Formula**: `books = N`, `questions = 2*N - 2`

Examples:
- 5 books, 8 questions (8/2=4, 5-4=1 book remains)
- 7 books, 12 questions (12/2=6, 7-6=1 book remains)
- 9 books, 16 questions (16/2=8, 9-8=1 book remains) ← **User's scenario**
- 11 books, 20 questions (20/2=10, 11-10=1 book remains)

### Safe Scenarios

When `books >> questions/2`:
- 16 books, 16 questions (16-8=8 books remain) ✅
- 10 books, 16 questions (10-8=2 books remain) ✅
- 12 books, 8 questions (12-4=8 books remain) ✅

## Impact Analysis

### Severity by Book Count

| Book Count | Bug Risk | User Impact |
|------------|----------|-------------|
| 4-6 books  | Low | Usually passes, small quizzes |
| 7-8 books  | Medium | Occasional failures |
| **9 books** | **HIGH** | **100% failure with 16 questions** |
| 10-11 books | Medium | Depends on question count |
| 12-15 books | Low | Enough diversity remains |
| 16+ books | Very Low | Plenty of books after filtering |

### Most Common User Scenarios

Based on typical OBOB divisions:
- **3-5 grade**: Usually 16 books → **Low risk** ✅
- **6-8 grade**: Usually 16 books → **Low risk** ✅
- **9-12 grade**: Varies, 8-12 books → **Medium risk** ⚠️
- **Custom selections**: 5-10 books → **HIGH RISK** ❌

## Recommended Fix

The filtering logic should be removed or significantly modified:

### Option 1: Remove Filtering
```typescript
// Don't filter at all - allow book overlap
const selectedContent = selectDistributedQuestions(contentQuestions, contentCount);
```

### Option 2: Smarter Filtering
```typescript
// Only filter if we have PLENTY of remaining books
const minRemainingBooks = Math.ceil(contentCount / 2);
if (contentCount <= usedBooks.size &&
    (bookKeys.length - usedBooks.size) >= minRemainingBooks) {
  remainingContentQuestions = contentQuestions.filter(q => !usedBooks.has(q.book_key));
}
```

### Option 3: Prioritize Non-Used Books
```typescript
// Try to use different books, but don't fail if we can't
const unusedBooks = contentQuestions.filter(q => !usedBooks.has(q.book_key));
if (unusedBooks.length >= contentCount) {
  remainingContentQuestions = unusedBooks;
} else {
  // Not enough unused books, use all content questions
  remainingContentQuestions = contentQuestions;
}
```

## Tests to Verify Fix

Once fixed, all 35 tests should pass:
- 28 currently passing tests should still pass
- 7 currently failing tests should turn green

Run: `pnpm test tests/question-randomness.test.ts`

Expected output after fix:
```
✓ tests/question-randomness.test.ts (35 tests)
  Tests  35 passed (35)
```
