# Database Schema

## Tables

### coaches
Parent coaches who manage teams of kids.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique coach identifier |
| email | TEXT | NOT NULL, UNIQUE | Coach's email address |
| password_hash | TEXT | NOT NULL | Bcrypt hashed password |
| name | TEXT | NOT NULL | Coach's display name |
| created_at | INTEGER | NOT NULL | Unix timestamp |

### team_members
Kids who are part of a coach's team.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique member identifier |
| coach_id | INTEGER | NOT NULL, FOREIGN KEY | Reference to coaches.id |
| username | TEXT | NOT NULL, UNIQUE | Unique username for login |
| magic_code_hash | TEXT | NOT NULL | Bcrypt hashed magic code |
| display_name | TEXT | NOT NULL | Member's display name |
| created_at | INTEGER | NOT NULL | Unix timestamp |

### reading_progress
Tracks how much of each book a team member has read.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique progress identifier |
| team_member_id | INTEGER | NOT NULL, FOREIGN KEY | Reference to team_members.id |
| book_key | TEXT | NOT NULL | Book identifier (e.g., "adas") |
| year | TEXT | NOT NULL | OBOB year (e.g., "2025-2026") |
| division | TEXT | NOT NULL | Division (e.g., "3-5") |
| pages_read | INTEGER | NOT NULL DEFAULT 0 | Number of pages read |
| updated_at | INTEGER | NOT NULL | Unix timestamp of last update |

**Unique constraint**: (team_member_id, book_key, year, division)

### question_attempts
Records each question attempt by a team member.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique attempt identifier |
| team_member_id | INTEGER | NOT NULL, FOREIGN KEY | Reference to team_members.id |
| question_text | TEXT | NOT NULL | The question text |
| book_key | TEXT | NOT NULL | Book identifier |
| year | TEXT | NOT NULL | OBOB year |
| division | TEXT | NOT NULL | Division |
| question_type | TEXT | NOT NULL | "in-which-book" or "content" |
| user_answer | TEXT | NOT NULL | User's answer (book_key for in-which-book) |
| correct_answer | TEXT | NULL | Correct answer (NULL for in-which-book) |
| is_correct | INTEGER | NOT NULL | 1 if correct, 0 if incorrect |
| points_earned | INTEGER | NOT NULL | Points: 5, 3, or 0 |
| attempted_at | INTEGER | NOT NULL | Unix timestamp |

## Indexes

- `idx_team_members_coach_id` on team_members(coach_id)
- `idx_reading_progress_member_id` on reading_progress(team_member_id)
- `idx_question_attempts_member_id` on question_attempts(team_member_id)
- `idx_question_attempts_attempted_at` on question_attempts(attempted_at)

## Notes

- All timestamps use Unix time (seconds since epoch)
- Passwords and magic codes are hashed using bcrypt
- SQLite uses INTEGER for booleans (0 = false, 1 = true)
- Foreign keys are enforced with ON DELETE CASCADE
