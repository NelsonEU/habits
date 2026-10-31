import type { SQLiteDatabase } from 'expo-sqlite';

import type { BackupHabit } from '@/backup/backup';
import {
  addReminder,
  applyMerge,
  archiveHabit,
  createHabit,
  deleteHabit,
  deleteReminder,
  loadSnapshot,
  replaceAll,
  restoreHabit,
  setChecked,
  setOrder,
  setReminderTime,
  setTheme,
  setWeekStart,
} from './repo';
import { initDatabase } from './schema';
import { openTestDatabase } from './test-database';

let db: SQLiteDatabase;

beforeEach(async () => {
  db = openTestDatabase();
  await initDatabase(db);
});

const names = () => loadSnapshot(db).habits.map((h) => h.name);
const days = (habitId: number) => [...(loadSnapshot(db).checks.get(habitId) ?? [])].sort();
const idOf = (name: string) => loadSnapshot(db).habits.find((h) => h.name === name)!.id;

const backupHabit = (habit: Partial<BackupHabit> & { name: string }): BackupHabit => ({
  uid: null,
  color: '#6E9BF2',
  startDay: '2024-01-01',
  archivedAt: null,
  checks: [],
  ...habit,
});

describe('habits', () => {
  test('a new habit goes last, counts from today and gets a permanent id', () => {
    createHabit(db, { name: 'Lire', color: '#6E9BF2' }, '2026-10-01');
    createHabit(db, { name: 'Marcher', color: '#80DAB5' }, '2026-10-02');
    const [read, walk] = loadSnapshot(db).habits;
    expect(read).toMatchObject({ name: 'Lire', color: '#6E9BF2', sortOrder: 0, startDay: '2026-10-01', archivedAt: null });
    expect(walk).toMatchObject({ name: 'Marcher', sortOrder: 1, startDay: '2026-10-02' });
    expect(read.uid).toMatch(/^[0-9a-f]{32}$/);
    expect(read.uid).not.toBe(walk.uid);
  });

  test('ticks and unticks a day; ticking twice is harmless', () => {
    createHabit(db, { name: 'Lire', color: '#6E9BF2' }, '2026-10-01');
    const id = idOf('Lire');
    setChecked(db, id, '2026-10-01', true);
    setChecked(db, id, '2026-10-01', true);
    setChecked(db, id, '2026-10-02', true);
    expect(days(id)).toEqual(['2026-10-01', '2026-10-02']);
    setChecked(db, id, '2026-10-01', false);
    expect(days(id)).toEqual(['2026-10-02']);
    expect([...loadSnapshot(db).tickedDays]).toEqual(['2026-10-02']);
  });

  test('saves a new order', () => {
    ['A', 'B', 'C'].forEach((name) => createHabit(db, { name, color: '#6E9BF2' }, '2026-10-01'));
    setOrder(db, [idOf('C'), idOf('A'), idOf('B')]);
    expect(names()).toEqual(['C', 'A', 'B']);
  });

  test('a restored habit comes back at the end of the list', () => {
    ['A', 'B', 'C'].forEach((name) => createHabit(db, { name, color: '#6E9BF2' }, '2026-10-01'));
    archiveHabit(db, idOf('A'));
    expect(loadSnapshot(db).habits.find((h) => h.name === 'A')!.archivedAt).not.toBeNull();
    restoreHabit(db, idOf('A'));
    expect(names()).toEqual(['B', 'C', 'A']);
    expect(loadSnapshot(db).habits.every((h) => h.archivedAt === null)).toBe(true);
  });

  test('deleting a habit removes it and its ticks, and nothing else', () => {
    createHabit(db, { name: 'Lire', color: '#6E9BF2' }, '2026-10-01');
    createHabit(db, { name: 'Marcher', color: '#80DAB5' }, '2026-10-01');
    setChecked(db, idOf('Lire'), '2026-10-01', true);
    setChecked(db, idOf('Marcher'), '2026-10-01', true);
    const lire = idOf('Lire');
    deleteHabit(db, lire);
    expect(names()).toEqual(['Marcher']);
    expect(db.getAllSync('SELECT * FROM checks WHERE habit_id = ?', lire)).toEqual([]);
    expect(days(idOf('Marcher'))).toEqual(['2026-10-01']);
  });
});

describe('settings and reminders', () => {
  test('defaults, saved values, and unknown values falling back to the default', () => {
    expect(loadSnapshot(db).settings).toEqual({ weekStartsOn: 'monday', theme: 'system' });
    setWeekStart(db, 'sunday');
    setTheme(db, 'dark');
    expect(loadSnapshot(db).settings).toEqual({ weekStartsOn: 'sunday', theme: 'dark' });
    db.runSync("UPDATE settings SET value = 'purple' WHERE key = 'theme'");
    expect(loadSnapshot(db).settings.theme).toBe('system');
  });

  test('reminders are added, changed, deleted, and listed by time', () => {
    addReminder(db, '08:30');
    const times = () => loadSnapshot(db).reminders.map((r) => r.time);
    expect(times()).toEqual(['08:30', '22:00']);
    const morning = loadSnapshot(db).reminders[0].id;
    setReminderTime(db, morning, '23:15');
    expect(times()).toEqual(['22:00', '23:15']);
    deleteReminder(db, morning);
    expect(times()).toEqual(['22:00']);
  });
});

describe('import', () => {
  test('a merge only adds: new ticks, an earlier start, and new habits', () => {
    createHabit(db, { name: 'Lire', color: '#6E9BF2' }, '2026-10-01');
    const lire = idOf('Lire');
    setChecked(db, lire, '2026-10-01', true);

    applyMerge(db, {
      updates: [{ habitId: lire, addChecks: ['2026-09-30', '2026-10-01'], startDay: '2026-09-01' }],
      inserts: [
        backupHabit({ uid: 'kept-id', name: 'Marcher', checks: ['2026-09-01'] }),
        backupHabit({ name: 'Fil dentaire', archivedAt: '2026-01-01T00:00:00.000Z' }),
      ],
    });

    const snapshot = loadSnapshot(db);
    expect(names()).toEqual(['Lire', 'Marcher', 'Fil dentaire']);
    expect(days(lire)).toEqual(['2026-09-30', '2026-10-01']);
    expect(snapshot.habits[0].startDay).toBe('2026-09-01');
    expect(snapshot.habits[1].uid).toBe('kept-id');
    expect(days(snapshot.habits[1].id)).toEqual(['2026-09-01']);
    // A source without ids (Daygraph) gets a new one.
    expect(snapshot.habits[2].uid).toMatch(/^[0-9a-f]{32}$/);
    expect(snapshot.habits[2].archivedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  test('replace swaps the habits and keeps settings and reminders', () => {
    createHabit(db, { name: 'Ancienne', color: '#6E9BF2' }, '2026-10-01');
    setChecked(db, idOf('Ancienne'), '2026-10-01', true);
    setTheme(db, 'dark');

    replaceAll(db, { habits: [backupHabit({ uid: 'u1', name: 'Nouvelle', checks: ['2025-05-05'] })] });

    expect(names()).toEqual(['Nouvelle']);
    expect(days(idOf('Nouvelle'))).toEqual(['2025-05-05']);
    expect(db.getAllSync('SELECT * FROM checks')).toHaveLength(1);
    expect(loadSnapshot(db).settings.theme).toBe('dark');
    expect(loadSnapshot(db).reminders).toHaveLength(1);
  });

  test('a replace that fails halfway changes nothing', () => {
    createHabit(db, { name: 'Ancienne', color: '#6E9BF2' }, '2026-10-01');
    setChecked(db, idOf('Ancienne'), '2026-10-01', true);

    // Two habits with the same permanent id break the unique index on the second insert.
    const broken = { habits: [backupHabit({ uid: 'same', name: 'A' }), backupHabit({ uid: 'same', name: 'B' })] };
    expect(() => replaceAll(db, broken)).toThrow();

    expect(names()).toEqual(['Ancienne']);
    expect(days(idOf('Ancienne'))).toEqual(['2026-10-01']);
  });
});
