import { NextRequest, NextResponse } from "next/server";
import { appendFeedbackToSheet } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedback, questionData } = body;

    // Prepare data for Google Sheets
    const feedbackDataForSheet = {
      timestamp: new Date().toISOString(),
      feedback,
      year: questionData.year,
      division: questionData.division,
      book: questionData.book,
      question: questionData.question,
      source: questionData.source,
    };

    // Save to Google Sheets
    await appendFeedbackToSheet(feedbackDataForSheet);

    console.log("Feedback successfully saved to Google Sheets");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing feedback:", error);
    
    // Fallback to console logging if Google Sheets fails
    console.log("=== QUESTION FEEDBACK (FALLBACK) ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Feedback:", request.body);
    console.log("=====================================");
    
    return NextResponse.json(
      { error: "Failed to process feedback" },
      { status: 500 }
    );
  }
}
