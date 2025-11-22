import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Check if user is logged in as a team member
    if (!session.isLoggedIn || session.userType !== 'team_member') {
      return NextResponse.json(
        { error: 'Unauthorized - Team member login required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const division = searchParams.get('division');

    if (!year || !division) {
      return NextResponse.json(
        { error: 'Year and division are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Get reading progress for this team member, year, and division
    const result = await db.execute({
      sql: 'SELECT book_key, pages_read, updated_at FROM reading_progress WHERE team_member_id = ? AND year = ? AND division = ?',
      args: [session.userId, year, division],
    });

    const progress = result.rows as {
      book_key: string;
      pages_read: number;
      updated_at: number;
    }[];

    const progressMap: Record<string, { pagesRead: number; updatedAt: number }> = {};
    for (const item of progress) {
      progressMap[item.book_key] = {
        pagesRead: item.pages_read,
        updatedAt: item.updated_at,
      };
    }

    return NextResponse.json({ progress: progressMap });
  } catch (error) {
    console.error('Reading progress get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
