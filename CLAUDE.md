# OBOB Quiz App - Project Context

## Project Overview

This is a Next.js 15 application for Oregon Battle of the Books (OBOB) quiz practice and interactive battles. The app helps students test their knowledge of OBOB books through quiz questions and battle modes.

**Key Features:**
- Quiz practice with content and "in which book" questions
- Interactive battle mode for competing with friends
- Book browsing and detailed book views
- Question submission and feedback system
- Google Sheets integration for question management
- Analytics tracking (PostHog, Vercel Analytics)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: React hooks and server components
- **Analytics**: PostHog, Vercel Analytics
- **Package Manager**: pnpm (version 9.15.4)
- **Deployment**: Vercel

## Project Structure

```
/app                    # Next.js App Router pages and API routes
  /api                  # API endpoints (feedback, questions)
  /battle               # Battle mode pages
  /books                # Book browsing and detail pages
  layout.tsx            # Root layout with Header/Footer
  page.tsx              # Home page
  providers.tsx         # PostHog provider wrapper

/components             # React components
  /ui                   # shadcn/ui components
  BookSelection.tsx     # Book selection interface
  QuizPage.tsx          # Main quiz component
  Header.tsx            # Site header
  Footer.tsx            # Site footer
  ...                   # Other feature components

/hooks                  # Custom React hooks

/lib                    # Utility functions and business logic
  books.ts              # Book data and utilities
  questions.ts          # Question loading and filtering
  google-sheets.ts      # Google Sheets API integration
  utils.ts              # General utilities

/types                  # TypeScript type definitions
  index.ts              # Core types (Book, Question, etc.)

/public                 # Static assets (images, covers, etc.)

/scripts                # Build and data processing scripts
  generate-question-counts.ts    # Generate question count metadata
  generate-question-exports.ts   # Export question data
  analyze_questions.py           # Question data analysis

/specs                  # Project specifications and documentation

questions.json          # Question database
question_sample.json    # Sample question data
```

## Core Types

### Book
```typescript
interface Book {
  book_key: string;
  title: string;
  author: string;
  cover: string;
  obob_division: "3-5" | "6-8" | "9-12";
  obob_year: "2024-2025";
  author_pronunciation?: string;
}
```

### Question Types
- **In-Which-Book Question**: Asks which book contains specific content
- **Content Question**: Asks specific questions about book content with answers

Both types include:
- `text`: Question text
- `book_key`: Reference to book
- `page`: Page number reference
- `source`: Optional source attribution
- `contributor`: Optional contributor name

## Development Workflow

### Setup
```bash
pnpm install
```

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Build Scripts
The prebuild script automatically runs:
1. `generate-question-counts.ts` - Generates metadata about question counts
2. `generate-question-exports.ts` - Exports question data

You can run these manually:
```bash
pnpm generate-counts
pnpm generate-exports
```

## Key Conventions

### Styling
- Use Tailwind CSS utility classes
- Follow the design system in `tailwind.config.ts`
- Components use `cn()` utility from `lib/utils.ts` for conditional classes

### Routing
- App Router with file-based routing
- Dynamic routes: `[year]`, `[division]`, `[book_key]`
- API routes in `/app/api`

### Components
- Server Components by default (Next.js 15)
- Client Components marked with `"use client"`
- UI components from shadcn/ui in `/components/ui`
- Feature components in `/components`

### Import Paths
- `@/*` aliases to root directory (configured in `tsconfig.json`)
- Example: `@/components/Header`, `@/lib/books`

### Data Management
- Questions stored in `questions.json`
- Books data in `lib/books.ts`
- Question filtering and loading in `lib/questions.ts`
- Google Sheets integration for question submission

## Important Files

### Configuration
- `next.config.ts` - Next.js configuration (includes SVG image config)
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration

### Entry Points
- `app/layout.tsx` - Root layout with header, footer, and providers
- `app/page.tsx` - Home page
- `app/providers.tsx` - PostHog analytics provider

### Core Logic
- `lib/books.ts` - Book data and utilities
- `lib/questions.ts` - Question management
- `lib/google-sheets.ts` - Google Sheets API integration
- `types/index.ts` - All TypeScript type definitions

## API Routes

### POST `/api/questions/submit`
Submit new questions to Google Sheets

### POST `/api/questions/battle`
Get questions for battle mode

### POST `/api/feedback`
Submit feedback about questions

## Environment Variables

Check for `.env.local` file for:
- Google Sheets API credentials
- PostHog API key
- Other service credentials

(These are gitignored for security)

## Testing Considerations

- Test question loading and filtering logic
- Verify quiz state management
- Check battle mode functionality
- Validate question submission flow
- Test responsive design on mobile/tablet/desktop

## Known Patterns

### Question Filtering
Questions can be filtered by:
- Division (3-5, 6-8, 9-12)
- Year (2024-2025)
- Book
- Question type (content, in-which-book)

### State Management
- Quiz state managed with React hooks
- Local storage for progress tracking
- Server components for data fetching

### Styling Patterns
- Mobile-first responsive design
- Container-based layouts
- Card components for content grouping
- Toast notifications for user feedback

## Development Tips

1. **Adding New Questions**: Questions go in `questions.json` or through Google Sheets integration
2. **Adding New Books**: Update `lib/books.ts` with book data
3. **New UI Components**: Use shadcn/ui components from `/components/ui`
4. **New Features**: Follow App Router patterns, prefer Server Components
5. **Styling**: Use existing Tailwind classes and design tokens
6. **Type Safety**: All data structures defined in `types/index.ts`

## Common Tasks

### Add a New Book
1. Add book data to `lib/books.ts`
2. Add cover image to `/public`
3. Update types if needed
4. Add questions to `questions.json`

### Add a New UI Component
1. Check if shadcn/ui has a suitable component
2. If needed, create in `/components` with proper typing
3. Use Tailwind for styling
4. Export from component file

### Modify Question Types
1. Update types in `types/index.ts`
2. Update question loading logic in `lib/questions.ts`
3. Update UI components that display questions
4. Update validation in submission forms

## Analytics & Monitoring

- **PostHog**: User behavior tracking (configured in `app/providers.tsx`)
- **Vercel Analytics**: Page views and performance (configured in `app/layout.tsx`)

## Performance Considerations

- Server Components for better performance
- Image optimization through next/image
- Static generation where possible
- Lazy loading for heavy components
- Bundle size monitoring

## Browser Support

Built with modern web standards, targeting:
- Latest Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## Additional Resources

- Next.js 15 documentation: https://nextjs.org/docs
- shadcn/ui components: https://ui.shadcn.com
- Tailwind CSS: https://tailwindcss.com
- Radix UI primitives: https://www.radix-ui.com
