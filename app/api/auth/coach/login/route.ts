import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Find coach
    const result = await db.execute({
      sql: 'SELECT id, email, password_hash, name FROM coaches WHERE email = ?',
      args: [email],
    });

    const coach = result.rows[0] as { id: number; email: string; password_hash: string; name: string } | undefined;

    if (!coach) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, coach.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const session = await getSession();
    session.userId = coach.id;
    session.userType = 'coach';
    session.email = coach.email;
    session.displayName = coach.name;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      coach: {
        id: coach.id,
        email: coach.email,
        name: coach.name,
      },
    });
  } catch (error) {
    console.error('Coach login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
