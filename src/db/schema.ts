import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Each entry upgrades the database by one version. Never edit a migration
 * once it has run on the phone: add a new one at the end instead.
 */
const MIGRATIONS: string[] = [
  // 1 — habits, ticks, and days the user went through (filled in)
  `
  CREATE TABLE habits (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    start_day TEXT NOT NULL,
    archived_at TEXT
  );
  CREATE TABLE checks (
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    PRIMARY KEY (habit_id, day)
  ) WITHOUT ROWID;
  CREATE TABLE filled_days (
    day TEXT PRIMARY KEY NOT NULL
  ) WITHOUT ROWID;
  `,
  // 2 — a permanent id per habit, so an export can be merged back even after a rename
  `
  ALTER TABLE habits ADD COLUMN uid TEXT;
  UPDATE habits SET uid = lower(hex(randomblob(16)));
  CREATE UNIQUE INDEX habits_uid ON habits (uid);
  `,
  // 3 — settings, and reminder times ("HH:MM"), starting with the brief's evening reminder
  `
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  ) WITHOUT ROWID;
  CREATE TABLE reminders (
    id INTEGER PRIMARY KEY NOT NULL,
    time TEXT NOT NULL
  );
  INSERT INTO reminders (time) VALUES ('22:00');
  `,
  // 4 — the habit palette, tuned so every pair stays distinguishable (see domain/palette.ts)
  `
  UPDATE habits SET color = CASE color
    WHEN '#F08CA8' THEN '#E985A2'
    WHEN '#B79CF5' THEN '#D3B8FF'
    WHEN '#C9D86A' THEN '#96A331'
    WHEN '#7FD9B4' THEN '#80DAB5'
    ELSE color
  END;
  `,
  // 5 — no more "filled-in" days: a day is done when something is ticked, as in Daygraph
  `
  DROP TABLE filled_days;
  `,
];

/** Runs at app start, before any screen renders. */
export async function initDatabase(db: SQLiteDatabase) {
  await db.execAsync(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(MIGRATIONS[version]);
      await tx.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }
}
