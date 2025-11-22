import { createClient } from '@libsql/client';
import type { Client } from '@libsql/client';

// Create Turso client singleton
let client: Client | null = null;
let initPromise: Promise<void> | null = null;

export function getDatabase(): Client {
  if (!client) {
    // For production (Vercel), use Turso cloud
    // For local development, use local SQLite file
    if (process.env.TURSO_DATABASE_URL) {
      client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      // Local development fallback
      client = createClient({
        url: 'file:obob.db',
      });
    }

    // Initialize database schema (async but we don't await here)
    // Schema is initialized on first call, subsequent calls are no-ops
    if (!initPromise) {
      initPromise = initializeDatabase(client);
    }
  }
  return client;
}

async function initializeDatabase(database: Client) {
  // Create coaches table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS coaches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  // Create team_members table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coach_id INTEGER NOT NULL,
      username TEXT NOT NULL UNIQUE,
      magic_code_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE
    )
  `);

  // Create reading_progress table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS reading_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_member_id INTEGER NOT NULL,
      book_key TEXT NOT NULL,
      year TEXT NOT NULL,
      division TEXT NOT NULL,
      pages_read INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
      UNIQUE(team_member_id, book_key, year, division)
    )
  `);

  // Create question_attempts table
  await database.execute(`
    CREATE TABLE IF NOT EXISTS question_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_member_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      book_key TEXT NOT NULL,
      year TEXT NOT NULL,
      division TEXT NOT NULL,
      question_type TEXT NOT NULL,
      user_answer TEXT NOT NULL,
      correct_answer TEXT,
      is_correct INTEGER NOT NULL,
      points_earned INTEGER NOT NULL,
      attempted_at INTEGER NOT NULL,
      FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
    )
  `);

  // Create indexes (one at a time for better compatibility)
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_team_members_coach_id ON team_members(coach_id)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_reading_progress_member_id ON reading_progress(team_member_id)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_question_attempts_member_id ON question_attempts(team_member_id)
  `);
  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_question_attempts_attempted_at ON question_attempts(attempted_at)
  `);
}

export function closeDatabase() {
  if (client) {
    client.close();
    client = null;
    initPromise = null;
  }
}
