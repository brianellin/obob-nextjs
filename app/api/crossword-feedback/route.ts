import { NextRequest, NextResponse } from "next/server";
import { appendCrosswordFeedbackToSheet } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback, email, teamCode, year, division, puzzleDate } = body;

    if (!feedback || !year || !division || !puzzleDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await appendCrosswordFeedbackToSheet({
      timestamp: new Date().toISOString(),
      feedback,
      email,
      teamCode,
      year,
      division,
      puzzleDate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing crossword feedback:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
