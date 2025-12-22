import { NextRequest, NextResponse } from "next/server";
import { appendNewsletterSignup } from "@/lib/google-sheets";

const VALID_ROLES = [
  "Student",
  "Parent/Guardian",
  "Teacher/Librarian",
  "OBOB Volunteer",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, role, name, divisions } = body as {
      email?: string;
      role?: string;
      name?: string;
      divisions?: string[];
    };

    // Validate required fields
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!role || !role.trim()) {
      return NextResponse.json(
        { error: "Please select your role" },
        { status: 400 }
      );
    }

    // Validate role is one of the allowed values
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected" },
        { status: 400 }
      );
    }

    // Check for student email addresses
    const emailLower = email.toLowerCase();
    if (emailLower.includes("student")) {
      return NextResponse.json(
        {
          error:
            "It looks like you're using a school or student email address. Unfortunately, we can't send emails to these addresses. Please ask a parent or guardian to sign up with their email instead!",
        },
        { status: 400 }
      );
    }

    // Save to Google Sheets
    await appendNewsletterSignup({
      timestamp: new Date().toISOString(),
      email: email.trim(),
      role,
      name: name?.trim(),
      divisions,
    });

    console.log("Newsletter signup saved to Google Sheets:", email);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing newsletter signup:", error);

    return NextResponse.json(
      { error: "Failed to process signup. Please try again." },
      { status: 500 }
    );
  }
}
