import { NextRequest, NextResponse } from "next/server";
import { appendQuestionToSheet } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      year,
      division,
      bookKey,
      questionType,
      questionText,
      page,
      answer,
      sourceName,
      sourceLink,
      sourceEmail,
    } = body;

    // Validate required fields
    if (!year || !division || !bookKey || !questionType || !questionText || !page || !sourceName || !sourceEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate question type
    if (!["content", "in-which-book"].includes(questionType)) {
      return NextResponse.json(
        { error: "Invalid question type" },
        { status: 400 }
      );
    }

    // For content questions, answer is required
    if (questionType === "content" && !answer) {
      return NextResponse.json(
        { error: "Answer is required for content questions" },
        { status: 400 }
      );
    }

    // Prepare data for Google Sheets
    const questionDataForSheet = {
      timestamp: new Date().toISOString(),
      status: "pending",
      year,
      division,
      bookKey,
      questionType,
      questionText,
      page: parseInt(page),
      answer: questionType === "content" ? answer : undefined,
      sourceName,
      sourceLink: sourceLink || "",
      sourceEmail,
    };

    // Save to Google Sheets
    await appendQuestionToSheet(questionDataForSheet);

    console.log("Question successfully saved to Google Sheets");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing question submission:", error);
    
    // Fallback to console logging if Google Sheets fails
    console.log("=== QUESTION SUBMISSION (FALLBACK) ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Question data:", request.body);
    console.log("======================================");
    
    return NextResponse.json(
      { error: "Failed to process question submission" },
      { status: 500 }
    );
  }
}
