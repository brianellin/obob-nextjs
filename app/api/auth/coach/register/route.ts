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
    const existingCoach = await db.execute({
      sql: 'SELECT id FROM coaches WHERE email = ?',
      args: [email],
    });

    if (existingCoach.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create coach
    const result = await db.execute({
      sql: 'INSERT INTO coaches (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)',
      args: [email, passwordHash, name, Math.floor(Date.now() / 1000)],
    });

    // Create session
    const session = await getSession();
    session.userId = Number(result.lastInsertRowid);
    session.userType = 'coach';
    session.email = email;
    session.displayName = name;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      coach: {
        id: Number(result.lastInsertRowid),
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
