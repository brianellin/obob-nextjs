/**
 * Seeded random number generator for deterministic puzzle generation
 *
 * Uses Mulberry32 - a fast, high-quality 32-bit PRNG
 * Given the same seed, it will always produce the same sequence
 */

/**
 * Create a hash from a string seed
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash >>> 0; // Ensure unsigned
}

/**
 * Create a seeded random number generator
 *
 * @param seed - A string seed (e.g., "2025-2026:6-8:2025-01-15")
 * @returns A function that returns random numbers between 0 and 1
 */
export function createSeededRandom(seed: string): () => number {
  let state = hashString(seed);

  // Mulberry32 PRNG
  return function (): number {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Shuffle an array using a seeded random function (Fisher-Yates)
 *
 * @param array - The array to shuffle
 * @param random - A seeded random function
 * @returns A new shuffled array
 */
export function seededShuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Pick n random items from an array using seeded random
 *
 * @param array - The array to pick from
 * @param n - Number of items to pick
 * @param random - A seeded random function
 * @returns Array of n randomly selected items
 */
export function seededPick<T>(array: T[], n: number, random: () => number): T[] {
  if (n >= array.length) {
    return seededShuffle(array, random);
  }
  const shuffled = seededShuffle(array, random);
  return shuffled.slice(0, n);
}

/**
 * Generate a random integer between min and max (inclusive) using seeded random
 */
export function seededInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}
