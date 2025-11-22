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

    const {
      questionText,
      bookKey,
      year,
      division,
      questionType,
      userAnswer,
      correctAnswer,
      isCorrect,
      pointsEarned,
    } = await request.json();

    // Validate input
    if (
      !questionText ||
      !bookKey ||
      !year ||
      !division ||
      !questionType ||
      !userAnswer ||
      isCorrect === undefined ||
      pointsEarned === undefined
    ) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Record question attempt
    await db.execute({
      sql: `INSERT INTO question_attempts
            (team_member_id, question_text, book_key, year, division, question_type, user_answer, correct_answer, is_correct, points_earned, attempted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        session.userId,
        questionText,
        bookKey,
        year,
        division,
        questionType,
        userAnswer,
        correctAnswer || null,
        isCorrect ? 1 : 0,
        pointsEarned,
        Math.floor(Date.now() / 1000),
      ],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Question attempt record error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
