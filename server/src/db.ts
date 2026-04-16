import 'dotenv/config';
import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = process.env.DB_PATH || join(process.cwd(), 'auth.db');

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                                         email TEXT UNIQUE NOT NULL,
                                         password TEXT NOT NULL,
                                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS challenges (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenge_assignments (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('active','done','failed')),
        completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS challenge_week_pools (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        week_start TEXT NOT NULL,
        challenge_ids TEXT NOT NULL,
        confirmed_at TEXT,
        PRIMARY KEY (user_id, week_start)
    );

    CREATE INDEX IF NOT EXISTS idx_challenges_user ON challenges(user_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_user_date ON challenge_assignments(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_week_pools_user ON challenge_week_pools(user_id);

    CREATE TABLE IF NOT EXISTS sections (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        section_id TEXT NOT NULL DEFAULT 'all',
        tags TEXT NOT NULL DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'active'
            CHECK(status IN ('active','done','archived')),
        pinned INTEGER NOT NULL DEFAULT 0,
        "order" INTEGER NOT NULL DEFAULT 0,
        due_date TEXT,
        notification TEXT,
        estimated_minutes INTEGER,
        completed_at TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        overflow_color TEXT NOT NULL,
        target_per_day INTEGER NOT NULL DEFAULT 1,
        time_slots TEXT NOT NULL DEFAULT '[]',
        radius INTEGER NOT NULL DEFAULT 60,
        "order" INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
        habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        completions INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (habit_id, user_id, date)
    );

    CREATE TABLE IF NOT EXISTS trash_items (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK(type IN ('task','habit','challenge')),
        data TEXT NOT NULL,
        deleted_at TEXT NOT NULL,
        expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sections_user ON sections(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_user_section ON tasks(user_id, section_id);
    CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id);
    CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_user ON habit_logs(habit_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_trash_user ON trash_items(user_id);
`);

export default db;
