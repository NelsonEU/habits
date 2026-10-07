import type { SQLiteDatabase } from 'expo-sqlite';

import type { Day } from '@/domain/day';
import type { Habit, Snapshot } from '@/domain/model';
import type { DaygraphImport } from '@/import/daygraph';
import { ImportError } from '@/import/errors';

type HabitRow = {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  start_day: string;
  archived_at: string | null;
};

/**
 * Loads everything at once. A few thousand rows a year is small enough that
 * screens can work from memory instead of running a query per day shown.
 */
export function loadSnapshot(db: SQLiteDatabase): Snapshot {
  const habits: Habit[] = db
    .getAllSync<HabitRow>('SELECT * FROM habits ORDER BY sort_order, id')
    .map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      sortOrder: r.sort_order,
      startDay: r.start_day,
      archivedAt: r.archived_at,
    }));

  const checks = new Map<number, Set<Day>>(habits.map((h) => [h.id, new Set()]));
  for (const { habit_id, day } of db.getAllSync<{ habit_id: number; day: string }>('SELECT habit_id, day FROM checks')) {
    checks.get(habit_id)?.add(day);
  }

  const filled = new Set(db.getAllSync<{ day: string }>('SELECT day FROM filled_days').map((r) => r.day));
  return { habits, checks, filled };
}

/** Ticks or unticks a habit, and records that the day was filled in. */
export function setChecked(db: SQLiteDatabase, habitId: number, day: Day, checked: boolean) {
  db.withTransactionSync(() => {
    if (checked) db.runSync('INSERT OR IGNORE INTO checks (habit_id, day) VALUES (?, ?)', habitId, day);
    else db.runSync('DELETE FROM checks WHERE habit_id = ? AND day = ?', habitId, day);
    db.runSync('INSERT OR IGNORE INTO filled_days (day) VALUES (?)', day);
  });
}

/** For a day where nothing was kept: it was filled in, not forgotten. */
export function markFilled(db: SQLiteDatabase, day: Day) {
  db.runSync('INSERT OR IGNORE INTO filled_days (day) VALUES (?)', day);
}

/**
 * Imports a Daygraph backup into an empty database. Daygraph doesn't record
 * filled-in days, so only days with at least one tick count as filled.
 */
export function importDaygraph(db: SQLiteDatabase, data: DaygraphImport, today: Day) {
  db.withTransactionSync(() => {
    const existing = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM habits');
    if (existing && existing.n > 0) throw new ImportError('not-empty');

    const ids = new Map<number, number>();
    for (const h of data.habits) {
      const { lastInsertRowId } = db.runSync(
        'INSERT INTO habits (name, color, sort_order, start_day) VALUES (?, ?, ?, ?)',
        h.name,
        h.color,
        h.sortOrder,
        data.firstDay ?? today,
      );
      ids.set(h.sourceId, lastInsertRowId);
    }
    for (const c of data.checks) {
      db.runSync('INSERT OR IGNORE INTO checks (habit_id, day) VALUES (?, ?)', ids.get(c.sourceId)!, c.day);
      db.runSync('INSERT OR IGNORE INTO filled_days (day) VALUES (?)', c.day);
    }
  });
}
