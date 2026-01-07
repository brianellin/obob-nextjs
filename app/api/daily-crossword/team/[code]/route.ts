/**
 * GET /api/daily-crossword/team/[code]
 *
 * Proxy to Cloudflare Worker to get team state.
 */

import { NextResponse } from "next/server";

const CLOUDFLARE_API_URL = process.env.NEXT_PUBLIC_CROSSWORD_WS_URL?.replace("wss://", "https://").replace("ws://", "http://") || "http://localhost:8787";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const response = await fetch(`${CLOUDFLARE_API_URL}/api/team/${code}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    
    if (response.ok) {
      return NextResponse.json({ success: true, teamState: data });
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Error proxying to Cloudflare:", error);
    return NextResponse.json(
      { error: "Failed to connect to game server" },
      { status: 500 }
    );
  }
}
