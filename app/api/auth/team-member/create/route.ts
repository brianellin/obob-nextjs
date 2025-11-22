import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { hashPassword, generateMagicCode } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    // Check if user is logged in as a coach
    if (!session.isLoggedIn || session.userType !== 'coach') {
      return NextResponse.json(
        { error: 'Unauthorized - Coach login required' },
        { status: 401 }
      );
    }

    const { username, displayName } = await request.json();

    // Validate input
    if (!username || !displayName) {
      return NextResponse.json(
        { error: 'Username and display name are required' },
        { status: 400 }
      );
    }

    // Validate username format (alphanumeric and underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if username already exists
    const existingMember = await db.execute({
      sql: 'SELECT id FROM team_members WHERE username = ?',
      args: [username],
    });

    if (existingMember.rows.length > 0) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Generate magic code
    const magicCode = generateMagicCode();
    const magicCodeHash = await hashPassword(magicCode);

    // Create team member
    const result = await db.execute({
      sql: 'INSERT INTO team_members (coach_id, username, magic_code_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [
        session.userId,
        username,
        magicCodeHash,
        displayName,
        Math.floor(Date.now() / 1000),
      ],
    });

    return NextResponse.json({
      success: true,
      teamMember: {
        id: Number(result.lastInsertRowid),
        username,
        displayName,
        magicCode, // Only returned once during creation
      },
    });
  } catch (error) {
    console.error('Team member creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
