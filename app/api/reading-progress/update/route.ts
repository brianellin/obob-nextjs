import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Check if user is logged in as a team member
    if (!session.isLoggedIn || session.userType !== 'team_member') {
      return NextResponse.json(
        { error: 'Unauthorized - Team member login required' },
        { status: 401 }
      );
    }

    const { bookKey, year, division, pagesRead } = await request.json();

    // Validate input
    if (!bookKey || !year || !division || pagesRead === undefined) {
      return NextResponse.json(
        { error: 'Book key, year, division, and pages read are required' },
        { status: 400 }
      );
    }

    if (pagesRead < 0) {
      return NextResponse.json(
        { error: 'Pages read cannot be negative' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Upsert reading progress
    const stmt = db.prepare(`
      INSERT INTO reading_progress (team_member_id, book_key, year, division, pages_read, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(team_member_id, book_key, year, division)
      DO UPDATE SET pages_read = ?, updated_at = ?
    `);

    const now = Math.floor(Date.now() / 1000);
    stmt.run(
      session.userId,
      bookKey,
      year,
      division,
      pagesRead,
      now,
      pagesRead,
      now
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reading progress update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
