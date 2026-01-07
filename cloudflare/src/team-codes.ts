/**
 * Team code and nickname generation (Cloudflare Worker version)
 */

/**
 * Unambiguous character set (Crockford's Base32 style)
 */
const UNAMBIGUOUS_CHARS = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Dog-themed words for team codes
 */
const DOG_WORDS = [
  "BARK", "WOOF", "PAWS", "TAIL", "BONE", "FETCH", "SPOT", "DASH",
  "LUNA", "BUDDY", "SCOUT", "DUKE", "ROSIE", "BEAU", "COCO", "FINN",
  "GIZMO", "OLLIE", "PENNY", "TEDDY", "MILO", "ZEUS", "ACE", "CHIP",
  "LUCKY", "MAX", "BELLA", "DAISY", "ROCKY", "RUBY",
] as const;

/**
 * Colors for nicknames
 */
const COLORS = [
  "Blue", "Red", "Green", "Purple", "Orange", "Pink", "Teal", "Gold",
  "Silver", "Coral", "Mint", "Peach", "Indigo", "Crimson", "Emerald", "Amber",
] as const;

/**
 * Dog-related nouns for nicknames
 */
const DOG_NOUNS = [
  "Pup", "Hound", "Beagle", "Retriever", "Terrier", "Collie", "Shepherd",
  "Spaniel", "Corgi", "Husky", "Doodle", "Pointer", "Setter", "Boxer",
  "Bulldog", "Poodle", "Pitbull",
] as const;

/**
 * Generate a random 4-character suffix
 */
function generateSuffix(): string {
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += UNAMBIGUOUS_CHARS[Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length)];
  }
  return suffix;
}

/**
 * Generate a unique team code (checks KV for uniqueness)
 */
export async function generateTeamCode(
  kv: KVNamespace,
  teamCodeExists: (kv: KVNamespace, code: string) => Promise<boolean>
): Promise<string> {
  const maxAttempts = 20;

  for (let i = 0; i < maxAttempts; i++) {
    const word = DOG_WORDS[Math.floor(Math.random() * DOG_WORDS.length)];
    const suffix = generateSuffix();
    const code = `${word}-${suffix}`;

    const exists = await teamCodeExists(kv, code);
    if (!exists) {
      return code;
    }
  }

  // Fallback: add extra suffix
  const word = DOG_WORDS[Math.floor(Math.random() * DOG_WORDS.length)];
  const suffix = generateSuffix() + generateSuffix().slice(0, 2);
  return `${word}-${suffix}`;
}

/**
 * Generate a unique nickname for a team member
 * Prioritizes unique colors so no two players on the same team share a color
 */
export function generateNickname(existingNicknames: string[] = []): string {
  const usedSet = new Set(existingNicknames.map((n) => n.toLowerCase()));
  
  // Extract colors already in use from existing nicknames
  const usedColors = new Set(
    existingNicknames.map((n) => n.split(" ")[0]?.toLowerCase()).filter(Boolean)
  );
  
  // Find available colors (not yet used by any team member)
  const availableColors = COLORS.filter(
    (c) => !usedColors.has(c.toLowerCase())
  );
  
  // Shuffle available colors for randomness
  const shuffledColors = availableColors.length > 0 
    ? [...availableColors].sort(() => Math.random() - 0.5)
    : [...COLORS].sort(() => Math.random() - 0.5);
  
  // Shuffle dog nouns for randomness
  const shuffledNouns = [...DOG_NOUNS].sort(() => Math.random() - 0.5);
  
  // Try each available color with random nouns first
  for (const color of shuffledColors) {
    for (const noun of shuffledNouns) {
      const nickname = `${color} ${noun}`;
      if (!usedSet.has(nickname.toLowerCase())) {
        return nickname;
      }
    }
  }

  // Fallback: add a number (all combinations exhausted)
  const color = shuffledColors[0] || COLORS[0];
  const noun = shuffledNouns[0] || DOG_NOUNS[0];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${color} ${noun} ${num}`;
}

/**
 * Validate a team code format
 */
export function isValidTeamCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  return /^[A-Z]{2,8}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{4,6}$/i.test(code.trim());
}

/**
 * Normalize a team code (uppercase, trimmed)
 */
export function normalizeTeamCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "s";
  for (let i = 0; i < 11; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/**
 * Generate a short unique ID for help requests
 */
export function generateHelpId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "h";
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
