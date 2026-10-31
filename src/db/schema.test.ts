import type { SQLiteDatabase } from 'expo-sqlite';

import { initDatabase, MIGRATIONS } from './schema';
import { openTestDatabase } from './test-database';

const LATEST = MIGRATIONS.length;

const userVersion = (db: SQLiteDatabase) =>
  db.getAllSync<{ user_version: number }>('PRAGMA user_version')[0].user_version;
const tables = (db: SQLiteDatabase) =>
  db.getAllSync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").map((r) => r.name);

/** A database as an older version of the app left it. */
function databaseAt(version: number) {
  const db = openTestDatabase();
  MIGRATIONS.slice(0, version).forEach((sql) => db.execSync(sql));
  db.execSync(`PRAGMA user_version = ${version}`);
  return db;
}

describe('initDatabase', () => {
  test('a new install gets the latest schema and the default reminder', async () => {
    const db = openTestDatabase();
    await initDatabase(db);
    expect(userVersion(db)).toBe(LATEST);
    expect(tables(db)).toEqual(['checks', 'habits', 'reminders', 'settings']);
    expect(db.getAllSync('SELECT time FROM reminders')).toEqual([{ time: '22:00' }]);
  });

  test.each(Array.from({ length: LATEST + 1 }, (_, version) => version))(
    'a database at version %i upgrades to the latest schema',
    async (version) => {
      const db = databaseAt(version);
      await initDatabase(db);
      expect(userVersion(db)).toBe(LATEST);
      expect(tables(db)).toEqual(['checks', 'habits', 'reminders', 'settings']);
    },
  );

  test('running it again on an up-to-date database changes nothing', async () => {
    const db = openTestDatabase();
    await initDatabase(db);
    await initDatabase(db);
    expect(userVersion(db)).toBe(LATEST);
    expect(db.getAllSync('SELECT time FROM reminders')).toHaveLength(1);
  });

  // The phone that ran the first build: every later migration must keep its data.
  test('upgrading from version 1 keeps every habit and tick', async () => {
    const db = databaseAt(1);
    db.execSync(`
      INSERT INTO habits (id, name, color, sort_order, start_day, archived_at) VALUES
        (1, 'Lire', '#F08CA8', 0, '2024-01-01', NULL),
        (2, 'Marcher', '#F0B35A', 1, '2024-03-10', '2025-02-01T10:00:00.000Z');
      INSERT INTO checks (habit_id, day) VALUES (1, '2024-01-01'), (1, '2024-01-02'), (2, '2024-03-10');
      INSERT INTO filled_days (day) VALUES ('2024-01-01'), ('2024-01-03');
    `);

    await initDatabase(db);

    const habits = db.getAllSync<{ id: number; uid: string; name: string; color: string; start_day: string; archived_at: string | null }>(
      'SELECT id, uid, name, color, start_day, archived_at FROM habits ORDER BY id',
    );
    expect(habits.map(({ uid, ...rest }) => rest)).toEqual([
      // Old palette colors move to the tuned ones; others stay.
      { id: 1, name: 'Lire', color: '#E985A2', start_day: '2024-01-01', archived_at: null },
      { id: 2, name: 'Marcher', color: '#F0B35A', start_day: '2024-03-10', archived_at: '2025-02-01T10:00:00.000Z' },
    ]);
    expect(habits[0].uid).toMatch(/^[0-9a-f]{32}$/);
    expect(habits[1].uid).toMatch(/^[0-9a-f]{32}$/);
    expect(habits[0].uid).not.toBe(habits[1].uid);
    expect(db.getAllSync('SELECT habit_id, day FROM checks ORDER BY habit_id, day')).toEqual([
      { habit_id: 1, day: '2024-01-01' },
      { habit_id: 1, day: '2024-01-02' },
      { habit_id: 2, day: '2024-03-10' },
    ]);
  });

  test('turns foreign keys on: deleting a habit deletes its ticks', async () => {
    const db = openTestDatabase();
    await initDatabase(db);
    db.execSync(`
      INSERT INTO habits (id, uid, name, color, sort_order, start_day) VALUES (1, 'a', 'Lire', '#E985A2', 0, '2024-01-01');
      INSERT INTO checks (habit_id, day) VALUES (1, '2024-01-01');
      DELETE FROM habits WHERE id = 1;
    `);
    expect(db.getAllSync('SELECT * FROM checks')).toEqual([]);
  });
});
