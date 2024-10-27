import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public/obob/books.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);

    // Add bookKey to each book object
    const booksWithKeys = Object.fromEntries(
      Object.entries(data.books).map(([key, book]) => [
        key,
        { ...book, bookKey: key }
      ])
    );

    return NextResponse.json({ books: booksWithKeys });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load books' },
      { status: 500 }
    );
  }
}
