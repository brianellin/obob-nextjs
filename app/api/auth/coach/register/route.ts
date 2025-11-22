import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if email already exists
    const existingCoach = db
      .prepare('SELECT id FROM coaches WHERE email = ?')
      .get(email);

    if (existingCoach) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create coach
    const result = db
      .prepare(
        'INSERT INTO coaches (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)'
      )
      .run(email, passwordHash, name, Math.floor(Date.now() / 1000));

    // Create session
    const session = await getSession();
    session.userId = result.lastInsertRowid as number;
    session.userType = 'coach';
    session.email = email;
    session.displayName = name;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      coach: {
        id: result.lastInsertRowid,
        email,
        name,
      },
    });
  } catch (error) {
    console.error('Coach registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
