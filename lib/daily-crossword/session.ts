/**
 * Session ID management for crossword feature with 24-hour expiry.
 *
 * COPPA compliance: Using a 24-hour expiry limits the persistence of
 * identifiers while maintaining good UX during a play session.
 * The expiry aligns with the daily puzzle reset.
 */

import { generateSessionId } from "./team-codes";

const SESSION_KEY = "daily-crossword-session";
const SESSION_EXPIRY_KEY = "daily-crossword-session-expiry";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Gets an existing valid session ID or creates a new one with 24h expiry.
 * Returns null if localStorage is not available (SSR).
 */
export function getOrCreateSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    const sessionId = localStorage.getItem(SESSION_KEY);

    // If session exists and hasn't expired, use it
    if (sessionId && expiry && Date.now() < parseInt(expiry, 10)) {
      return sessionId;
    }

    // Create new session with 24h expiry
    const newSessionId = generateSessionId();
    const newExpiry = Date.now() + TWENTY_FOUR_HOURS_MS;

    localStorage.setItem(SESSION_KEY, newSessionId);
    localStorage.setItem(SESSION_EXPIRY_KEY, String(newExpiry));

    return newSessionId;
  } catch {
    // localStorage not available or blocked
    return null;
  }
}

/**
 * Gets the current session ID without creating a new one.
 * Returns null if no valid session exists.
 */
export function getSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const expiry = localStorage.getItem(SESSION_EXPIRY_KEY);
    const sessionId = localStorage.getItem(SESSION_KEY);

    // Return session only if it exists and hasn't expired
    if (sessionId && expiry && Date.now() < parseInt(expiry, 10)) {
      return sessionId;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clears the current session (for testing or explicit logout).
 */
export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  } catch {
    // Ignore errors
  }
}
