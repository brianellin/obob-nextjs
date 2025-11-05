# OBOB Data Validation Tests

This directory contains comprehensive validation tests for all OBOB questions, books, and sources data.

## What Gets Validated

The test suite (`data-validation.test.ts`) validates:

### 1. Directory Structure
- Valid year directories (format: YYYY-YYYY)
- Valid division directories (3-5, 6-8, 9-12)
- Proper organization of data files

### 2. Books Validation
- `books.json` exists in each year/division
- Valid JSON structure
- All required fields present:
  - `book_key` (string)
  - `title` (string)
  - `author` (string)
  - `cover` (string, starts with /)
  - `obob_division` (matches directory)
  - `obob_year` (string)
  - `author_pronunciation` (optional string)
- Book keys match object keys
- Division matches directory structure

### 3. Sources Validation
- `sources.json` exists in each year/division
- Valid JSON structure with `sources` array
- Each source has:
  - `path` (string, relative path to questions.json)
  - `name` (string, display name)
  - `link` (string or null, URL to source)
- Question files exist at specified paths
- Question files contain valid JSON

### 4. Questions Validation
- Valid question structure with `questions` array
- All required base fields:
  - `type` ("in-which-book" or "content")
  - `text` (non-empty string)
  - `book_key` (string, references valid book)
- Optional fields validated if present:
  - `page` (number >= 0, allows 0, undefined, or null)
  - `contributor` (string)
  - `source` (object with name and link)
- Type-specific validation:
  - "content" questions MUST have `answer` field (non-empty string)
  - "in-which-book" questions MUST NOT have `answer` field

### 5. Data Consistency
- Questions reference valid book keys
- No orphaned books (books without questions trigger warning)
- Duplicate detection (warns about same text + book combinations)
- At least one question per division
- Both question types present (when sufficient questions exist)

## Running Tests

```bash
# Run all tests once
pnpm run test

# Run tests in watch mode (for development)
pnpm run test:watch

# Run tests with interactive UI
pnpm run test:ui

# Run only the data validation tests
pnpm run test:validate
```

## Integration with Build Process

Tests are automatically run as part of the `prebuild` script:

```bash
pnpm run prebuild  # Runs: test → generate-counts → generate-exports
pnpm run build     # Runs: prebuild → next build
```

This ensures that:
1. All data is valid before building
2. Build process fails if data validation fails
3. Invalid data never makes it to production

## Test Output

### Success
When all tests pass, you'll see:
```
✓ tests/data-validation.test.ts (14 tests) 216ms
  Test Files  1 passed (1)
  Tests  14 passed (14)
```

### Failures
When tests fail, you'll see detailed error messages:
```
AssertionError: page should be positive for question 2024-2025/3-5/lake_oswego/questions.json[143]
```

This tells you:
- What validation failed ("page should be positive")
- Exact location (file path and array index)
- Expected vs actual values

### Warnings
The tests may output warnings for non-critical issues:
- Duplicate questions (same text for same book)
- Books without questions
- Divisions with only one question type

## Common Issues and Fixes

### Invalid Page Number
**Error**: `page should be non-negative (>= 0) for question ...` or `page should be number for question ...`
**Fix**: Update the question's `page` field to a non-negative number or valid type

```json
// Bad - negative number
{ "page": -1 }

// Bad - wrong type
{ "page": "42" }

// Good - all of these are valid
{ "page": 0 }      // Allowed
{ "page": 1 }      // Allowed
{ "page": 42 }     // Allowed
// page field omitted entirely - also allowed
```

Note: Page numbers are optional. Missing page fields are allowed.

### Missing Required Field
**Error**: `answer missing for content question ...`
**Fix**: Add the required field

```json
// Bad - content question without answer
{
  "type": "content",
  "text": "What is the character's name?",
  "book_key": "some-book",
  "page": 42
}

// Good
{
  "type": "content",
  "text": "What is the character's name?",
  "book_key": "some-book",
  "page": 42,
  "answer": "Alice"
}
```

### Invalid Question Type
**Error**: `type should be 'in-which-book' or 'content' ...`
**Fix**: Use only valid question types

```json
// Bad
{ "type": "trivia" }

// Good
{ "type": "content" }
// or
{ "type": "in-which-book" }
```

### Invalid Book Reference
**Error**: `Question references invalid book_key "xyz" ...`
**Fix**: Ensure the book_key exists in books.json

### Wrong Answer Field
**Error**: `in-which-book question should not have answer field ...`
**Fix**: Remove the answer field from in-which-book questions

```json
// Bad
{
  "type": "in-which-book",
  "text": "does a character have red hair?",
  "book_key": "some-book",
  "page": 42,
  "answer": "Yes"  // ← Remove this
}

// Good
{
  "type": "in-which-book",
  "text": "does a character have red hair?",
  "book_key": "some-book",
  "page": 42
}
```

## Extending the Tests

To add new validations:

1. Open `tests/data-validation.test.ts`
2. Add a new `describe` or `it` block
3. Use the helper functions like `getAllYearDivisions()`
4. Write assertions using `expect()`

Example:
```typescript
it('should have valid question length', async () => {
  const combinations = await getAllYearDivisions();

  for (const { year, division } of combinations) {
    // ... load questions
    for (const question of questions) {
      expect(question.text.length).toBeLessThan(500);
    }
  }
});
```

## CI/CD Integration

The tests are designed to work in CI/CD pipelines:

- Exit code 0 on success
- Exit code 1 on failure
- Detailed error messages for debugging
- Fast execution (typically < 500ms)

Simply run `pnpm run test` in your CI pipeline.
