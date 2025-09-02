import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback, questionData } = body;

    // Log the feedback to console for now
    console.log("=== QUESTION FEEDBACK RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Feedback:", feedback);
    console.log("Question Data:", JSON.stringify(questionData, null, 2));
    console.log("=====================================");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing feedback:", error);
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
