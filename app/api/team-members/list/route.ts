import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    // Check if user is logged in as a coach
    if (!session.isLoggedIn || session.userType !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized - Coach login required' },
        { status: 401 }
      );
    }

    const db = getDatabase();

    // Get all team members for this coach
    const result = await db.execute({
      sql: 'SELECT id, username, display_name, created_at FROM team_members WHERE coach_id = ? ORDER BY created_at DESC',
      args: [session.userId],
    });

    const members = result.rows as {
      id: number;
      username: string;
      display_name: string;
      created_at: number;
    }[];

    return NextResponse.json({
      teamMembers: members.map((m) => ({
        id: m.id,
        username: m.username,
        displayName: m.display_name,
        createdAt: m.created_at,
      })),
    });
  } catch (error) {
    console.error('Team members list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
