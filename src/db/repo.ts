import type { SQLiteDatabase } from 'expo-sqlite';

import type { Day } from '@/domain/day';
import type { Habit, Snapshot } from '@/domain/model';
import type { Backup, BackupHabit } from '@/backup/backup';
import type { MergePlan } from '@/backup/merge';

type HabitRow = {
  id: number;
  uid: string;
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
      uid: r.uid,
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

const NEXT_SORT_ORDER = 'SELECT COALESCE(MAX(sort_order), -1) + 1 FROM habits';
/** 32 random hex characters: unique enough for a permanent habit id. */
const NEW_UID = 'lower(hex(randomblob(16)))';

/** A new habit goes last, and counts from today. */
export function createHabit(db: SQLiteDatabase, habit: { name: string; color: string }, today: Day) {
  db.runSync(
    `INSERT INTO habits (uid, name, color, sort_order, start_day) VALUES (${NEW_UID}, ?, ?, (${NEXT_SORT_ORDER}), ?)`,
    habit.name,
    habit.color,
    today,
  );
}

export function updateHabit(db: SQLiteDatabase, id: number, habit: { name: string; color: string }) {
  db.runSync('UPDATE habits SET name = ?, color = ? WHERE id = ?', habit.name, habit.color, id);
}

/** Saves a new display order: `ids` from first to last. */
export function setOrder(db: SQLiteDatabase, ids: number[]) {
  db.withTransactionSync(() => {
    ids.forEach((id, index) => db.runSync('UPDATE habits SET sort_order = ? WHERE id = ?', index, id));
  });
}

export function archiveHabit(db: SQLiteDatabase, id: number) {
  db.runSync('UPDATE habits SET archived_at = ? WHERE id = ?', new Date().toISOString(), id);
}

/** Back among the active habits, at the end of the list. */
export function restoreHabit(db: SQLiteDatabase, id: number) {
  db.runSync(`UPDATE habits SET archived_at = NULL, sort_order = (${NEXT_SORT_ORDER}) WHERE id = ?`, id);
}

/** Deletes a habit and all its ticks, for good. Filled-in days stay: they're about the day, not the habit. */
export function deleteHabit(db: SQLiteDatabase, id: number) {
  db.withTransactionSync(() => {
    // ON DELETE CASCADE would do it too; explicit, in case foreign keys were ever off on a connection.
    db.runSync('DELETE FROM checks WHERE habit_id = ?', id);
    db.runSync('DELETE FROM habits WHERE id = ?', id);
  });
}

/** Inserts a backup habit with its ticks, after the existing ones. Sources without ids get a new one. */
function insertHabit(db: SQLiteDatabase, habit: BackupHabit) {
  const { lastInsertRowId } = db.runSync(
    `INSERT INTO habits (uid, name, color, sort_order, start_day, archived_at)
     VALUES (COALESCE(?, ${NEW_UID}), ?, ?, (${NEXT_SORT_ORDER}), ?, ?)`,
    habit.uid,
    habit.name,
    habit.color,
    habit.startDay,
    habit.archivedAt,
  );
  for (const day of habit.checks) {
    db.runSync('INSERT OR IGNORE INTO checks (habit_id, day) VALUES (?, ?)', lastInsertRowId, day);
  }
}

function addFilledDays(db: SQLiteDatabase, days: Day[]) {
  for (const day of days) db.runSync('INSERT OR IGNORE INTO filled_days (day) VALUES (?)', day);
}

/** Applies a merge (see planMerge): only adds, in one transaction. */
export function applyMerge(db: SQLiteDatabase, plan: MergePlan) {
  db.withTransactionSync(() => {
    for (const { habitId, addChecks, startDay } of plan.updates) {
      for (const day of addChecks) db.runSync('INSERT OR IGNORE INTO checks (habit_id, day) VALUES (?, ?)', habitId, day);
      if (startDay) db.runSync('UPDATE habits SET start_day = ? WHERE id = ?', startDay, habitId);
    }
    plan.inserts.forEach((habit) => insertHabit(db, habit));
    addFilledDays(db, plan.addFilled);
  });
}

/** Replaces all the app's data with a backup, in one transaction: either everything changes or nothing. */
export function replaceAll(db: SQLiteDatabase, backup: Backup) {
  db.withTransactionSync(() => {
    db.runSync('DELETE FROM checks');
    db.runSync('DELETE FROM habits');
    db.runSync('DELETE FROM filled_days');
    backup.habits.forEach((habit) => insertHabit(db, habit));
    addFilledDays(db, backup.filledDays);
  });
}
