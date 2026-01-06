/**
 * Cloudflare Worker Entry Point
 *
 * Routes requests to the appropriate CrosswordRoom Durable Object
 * based on the team code in the URL.
 */

import { CrosswordRoom } from "./crossword-room";

export { CrosswordRoom };

interface Env {
  CROSSWORD_ROOM: DurableObjectNamespace;
  PUZZLE_API_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers for cross-origin requests from the Next.js app
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Upgrade, Connection, Sec-WebSocket-Key, Sec-WebSocket-Version, Sec-WebSocket-Protocol",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", service: "obob-crossword-realtime" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Route: /room/:teamCode
    // WebSocket connection to a specific room
    const roomMatch = url.pathname.match(/^\/room\/([A-Z0-9]+)$/i);
    if (roomMatch) {
      const teamCode = roomMatch[1].toUpperCase();

      // Validate team code format (e.g., BARK42)
      if (!/^[A-Z]{4}[0-9]{2}$/.test(teamCode)) {
        return new Response(JSON.stringify({ error: "Invalid team code format" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Get or create the Durable Object for this room
      const id = env.CROSSWORD_ROOM.idFromName(`room:${teamCode}`);
      const room = env.CROSSWORD_ROOM.get(id);

      // Forward the request to the Durable Object
      const response = await room.fetch(request);

      // Add CORS headers to the response (for non-WebSocket responses)
      if (request.headers.get("Upgrade") !== "websocket") {
        const newHeaders = new Headers(response.headers);
        for (const [key, value] of Object.entries(corsHeaders)) {
          newHeaders.set(key, value);
        }
        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      }

      return response;
    }

    // Route: /rooms (list active rooms - for debugging/admin)
    if (url.pathname === "/rooms" && request.method === "GET") {
      // Note: Durable Objects don't provide a way to list all instances
      // This is just a placeholder for potential future admin functionality
      return new Response(JSON.stringify({ message: "Room listing not available" }), {
        status: 501,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  },
};
