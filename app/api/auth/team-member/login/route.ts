import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { username, magicCode } = await request.json();

    // Validate input
    if (!username || !magicCode) {
      return NextResponse.json(
        { error: 'Username and magic code are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Find team member
    const result = await db.execute({
      sql: 'SELECT id, username, magic_code_hash, display_name, coach_id FROM team_members WHERE username = ?',
      args: [username],
    });

    const member = result.rows[0] as
      | {
          id: number;
          username: string;
          magic_code_hash: string;
          display_name: string;
          coach_id: number;
        }
      | undefined;

    if (!member) {
      return NextResponse.json(
        { error: 'Invalid username or magic code' },
        { status: 401 }
      );
    }

    // Verify magic code
    const isValid = await verifyPassword(magicCode, member.magic_code_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid username or magic code' },
        { status: 401 }
      );
    }

    // Create session
    const session = await getSession();
    session.userId = member.id;
    session.userType = 'team_member';
    session.username = member.username;
    session.displayName = member.display_name;
    session.coachId = member.coach_id;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      teamMember: {
        id: member.id,
        username: member.username,
        displayName: member.display_name,
      },
    });
  } catch (error) {
    console.error('Team member login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
