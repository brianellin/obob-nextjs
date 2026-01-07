/**
 * Team code and nickname generation
 *
 * Team codes are memorable dog-themed codes like "BARK42"
 * Nicknames are auto-generated fun names like "Blue Pup"
 */

import { teamCodeExists } from "./kv";

/**
 * Unambiguous character set (Crockford's Base32 style)
 * Excludes: 0, O (look alike), 1, I, L (look alike)
 */
const UNAMBIGUOUS_CHARS = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Dog-themed words for team codes
 */
const DOG_WORDS = [
  "BARK",
  "WOOF",
  "PAWS",
  "TAIL",
  "BONE",
  "FETCH",
  "SPOT",
  "DASH",
  "LUNA",
  "BUDDY",
  "SCOUT",
  "DUKE",
  "ROSIE",
  "BEAU",
  "COCO",
  "FINN",
  "GIZMO",
  "OLLIE",
  "PENNY",
  "TEDDY",
  "MILO",
  "ZEUS",
  "ACE",
  "CHIP",
  "LUCKY",
  "MAX",
  "BELLA",
  "DAISY",
  "ROCKY",
  "RUBY",
] as const;

/**
 * Colors for nicknames
 */
const COLORS = [
  "Blue",
  "Red",
  "Green",
  "Purple",
  "Orange",
  "Pink",
  "Teal",
  "Gold",
  "Silver",
  "Coral",
  "Mint",
  "Peach",
  "Indigo",
  "Crimson",
  "Emerald",
  "Amber",
] as const;

/**
 * Dog-related nouns for nicknames
 */
const DOG_NOUNS = [
  "Pup",
  "Hound",
  "Beagle",
  "Retriever",
  "Terrier",
  "Collie",
  "Shepherd",
  "Spaniel",
  "Corgi",
  "Husky",
  "Doodle",
  "Pointer",
  "Setter",
  "Boxer",
  "Bulldog",
  "Poodle",
  "Pitbull",
] as const;

/**
 * Generate a random 4-character suffix from unambiguous characters
 */
function generateSuffix(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += UNAMBIGUOUS_CHARS[Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length)];
  }
  return suffix;
}

/**
 * Generate a unique team code
 *
 * Format: {DOG_WORD}-{4-char unambiguous suffix}
 * Examples: BARK-A7X2, ROSIE-9KMN, FETCH-3HPQ
 */
export async function generateTeamCode(): Promise<string> {
  const maxAttempts = 20;

  for (let i = 0; i < maxAttempts; i++) {
    const word = DOG_WORDS[Math.floor(Math.random() * DOG_WORDS.length)];
    const suffix = generateSuffix();
    const code = `${word}-${suffix}`;

    // Check if already exists
    const exists = await teamCodeExists(code);
    if (!exists) {
      return code;
    }
  }

  // Fallback: add extra suffix to make it unique
  const word = DOG_WORDS[Math.floor(Math.random() * DOG_WORDS.length)];
  const suffix = generateSuffix() + generateSuffix().slice(0, 2);
  return `${word}-${suffix}`;
}

/**
 * Generate a unique nickname for a team member
 *
 * Format: {Color} {DogNoun}
 * Examples: "Blue Pup", "Gold Retriever", "Purple Corgi"
 *
 * @param existingNicknames - Already used nicknames in the team
 */
export function generateNickname(existingNicknames: string[] = []): string {
  const usedSet = new Set(existingNicknames.map((n) => n.toLowerCase()));

  // Try random combinations first
  for (let i = 0; i < 50; i++) {
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const noun = DOG_NOUNS[Math.floor(Math.random() * DOG_NOUNS.length)];
    const nickname = `${color} ${noun}`;

    if (!usedSet.has(nickname.toLowerCase())) {
      return nickname;
    }
  }

  // Fallback: add a number
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const noun = DOG_NOUNS[Math.floor(Math.random() * DOG_NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${color} ${noun} ${num}`;
}

/**
 * Get a consistent cursor color based on the nickname
 * Returns a Tailwind color class
 */
export function getCursorColor(nickname: string): string {
  const colors = [
    "bg-pink-400",
    "bg-purple-400",
    "bg-blue-400",
    "bg-green-400",
    "bg-yellow-400",
    "bg-orange-400",
    "bg-red-400",
    "bg-indigo-400",
    "bg-teal-400",
    "bg-cyan-400",
  ];

  // Simple hash from nickname
  let hash = 0;
  for (let i = 0; i < nickname.length; i++) {
    hash = (hash << 5) - hash + nickname.charCodeAt(i);
    hash = hash & hash;
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Validate a team code format
 * Format: DOG_WORD-XXXX where X is from unambiguous character set
 */
export function isValidTeamCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  // Match formats like "BARK-A7X2" or "ROSIE-9KMN" (with optional extended suffix for fallback)
  return /^[A-Z]{2,8}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4,6}$/i.test(code.trim());
}

/**
 * Normalize a team code (uppercase, trimmed)
 */
export function normalizeTeamCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Generate a short unique ID for help requests
 */
export function generateHelpId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "h"; // Prefix with 'h' for help
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Generate a unique session ID for a user
 */
export function generateSessionId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "s"; // Prefix with 's' for session
  for (let i = 0; i < 11; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
