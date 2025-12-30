# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OBOB.dog is a Next.js application for the helping kids practice for the Oregon Battle of the Books (OBOB). It allows users to practice quiz questions from multiple OBOB divisions and years, with both solo and friend battle modes.

## Development Commands

### Essential Commands
- `pnpm run dev` - Start development server (logs to `logs/dev.log`)
- `pnpm run build` - Build for production (auto-runs prebuild scripts)
- `pnpm run lint` - Run ESLint

### Dev Server Logs
When the dev server is running, logs are written to `logs/dev.log`. To read recent logs:
- `tail -n 100 logs/dev.log` - View last 100 lines
- `tail -f logs/dev.log` - Follow logs in real-time
- `grep -i error logs/dev.log` - Search for errors

The log file is overwritten each time `pnpm run dev` starts.

### Build Process
The build process includes prebuild scripts that MUST run before building:
- `npm run prebuild` - Generates question counts and question exports
- `npm run generate-counts` - Manually generate question counts (creates `lib/question-counts.json`)
- `npm run generate-exports` - Manually generate CSV exports (creates files in `public/exports/`)

These scripts process questions from `public/obob/{year}/{division}/` directories and are required for the app to function correctly.

### Package Manager
This project uses **pnpm** (specified in package.json with version 9.15.4). Always use pnpm instead of npm:
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start dev server
- `pnpm run build` - Build

## Architecture

### Data Structure

The app is organized around OBOB years and divisions:

```
public/obob/
├── 2024-2025/
│   ├── 3-5/       (3rd-5th grade division)
│   └── 6-8/       (6th-8th grade division)
└── 2025-2026/
    ├── 3-5/
    ├── 6-8/
    └── 9-12/      (9th-12th grade division)
```

Each division directory contains:
- `books.json` - Book metadata with keys like `book_key`, `title`, `author`, `cover`, `author_pronunciation`
- `sources.json` - Array of question sources with `path`, `name`, and `link`
- Subdirectories for each question source (e.g., `parent_group/`, `lake_oswego/`, `cedar_mill/`)
  - Each contains a `questions.json` file

### Question Types

Two question types exist:

1. **"in-which-book"** - Questions asking which book contains a specific event/detail
   - Requires `type`, `text`, `book_key`, `page`
   - No `answer` field (the answer is the book itself)

2. **"content"** - Questions about specific content within a known book
   - Requires `type`, `text`, `book_key`, `page`, `answer`

Questions are loaded via `lib/questions.ts` which:
- Reads `sources.json` to discover all question files
- Loads and combines questions from multiple sources
- Attaches source metadata to each question
- Implements smart distribution algorithm to ensure even representation across books

### Core Components

**QuizPage** (`components/QuizPage.tsx`) - Main quiz interface supporting:
- Solo mode (self-paced practice)
- Friend mode (15-second timer per question)
- 5/3/0 point scoring system (correct/partially correct/incorrect)
- Question feedback submission
- Success animations with confetti for perfect answers

**Battle Flow** (`app/battle/page.tsx`) - Multi-step quiz setup:
1. Year/division selection
2. Book selection (minimum 4 for "in-which-book" questions)
3. Quiz mode and question type selection
4. QuizPage rendering

### API Routes

**`/api/questions/battle`** (POST) - Main question fetching endpoint:
- Accepts: `selectedBooks`, `questionCount`, `questionType`, `year`, `division`
- Returns: Randomized, evenly-distributed questions with book metadata
- Enforces minimum 4 books for "in-which-book" questions

### Question Selection Logic

The `selectQuestions` function in `lib/questions.ts` implements intelligent distribution:
- When `type: "both"`, splits count evenly between question types
- Uses `selectDistributedQuestions` to ensure even representation across all selected books
- For more questions than books: distributes multiple questions per book in round-robin fashion
- For fewer questions than books: selects one question per book, randomizing which books are used

### Generated Files

Build scripts generate:
- `lib/question-counts.json` - Pre-computed counts for all year/division pairs
- `public/exports/{year}/{division}/` - CSV exports per book and all-questions CSVs with format: `book_key`, `question_type`, `page`, `text`, `answer`, `author_name`, `book_title`, `source_name`

### Analytics & Monitoring

- PostHog for event tracking
- Vercel Analytics integration
- Tracks events: `battleStarted`, `battleFinished` with quiz metadata

### UI/Styling

- Tailwind CSS with custom animations in `app/globals.css`
- Radix UI components in `components/ui/`
- Custom components: `WavyUnderline`, `BookHeartIcon`, `RosieIcon`

## Important Patterns

### TypeScript Path Aliases
Use `@/` for imports (configured in tsconfig.json):
```typescript
import { Book } from '@/types';
import { getAllQuestions } from '@/lib/questions';
```

### Question Loading
Always use the centralized question loading:
```typescript
import { getAllQuestions, selectQuestions } from '@/lib/questions';
const questions = await getAllQuestions(year, division);
const selected = selectQuestions(questions, count, type);
```

### Book Pronunciation
Some books have `author_pronunciation` fields - the UI shows these on hover using Radix Popover.

### Security Overrides
`pnpm.overrides` in package.json forces Next.js version updates for security patches.


### Testing Question Distribution
Uncomment the logging in `/api/questions/battle/route.ts` (lines 48-61) to see questions-per-book and question-type distributions in the console.
