import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Books } from '@/types';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public/obob/books.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents) as { books: Books };

    return NextResponse.json({ books: data.books });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load books' },
      { status: 500 }
    );
  }
}
