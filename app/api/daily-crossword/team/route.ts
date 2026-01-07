/**
 * POST /api/daily-crossword/team
 *
 * Proxy to Cloudflare Worker for team create/join operations.
 */

import { NextResponse } from "next/server";

const CLOUDFLARE_API_URL = process.env.NEXT_PUBLIC_CROSSWORD_WS_URL?.replace("wss://", "https://").replace("ws://", "http://") || "http://localhost:8787";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${CLOUDFLARE_API_URL}/api/team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying to Cloudflare:", error);
    return NextResponse.json(
      { error: "Failed to connect to game server" },
      { status: 500 }
    );
  }
}
