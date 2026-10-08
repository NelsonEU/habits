import type { Day } from './day';
import type { HabitHistory } from './stats';

export type Habit = {
  id: number;
  /** Permanent id, kept across export and import (unlike `id`, which is local to this phone). */
  uid: string;
  name: string;
  /** "#RRGGBB", one of HABIT_COLORS. */
  color: string;
  sortOrder: number;
  /** First day the habit counts for (its creation day, or the import's first day). */
  startDay: Day;
  /** ISO timestamp, or null while the habit is active. */
  archivedAt: string | null;
};

export type WeekStart = 'monday' | 'sunday';

export type ThemePreference = 'system' | 'light' | 'dark';

export type Settings = { weekStartsOn: WeekStart; theme: ThemePreference };

export const DEFAULT_SETTINGS: Settings = { weekStartsOn: 'monday', theme: 'system' };

/** A daily reminder at a local time, "HH:MM". */
export type Reminder = { id: number; time: string };

/** All the app's data, loaded in memory. */
export type Snapshot = {
  /** Every habit, archived ones included, in display order. */
  habits: Habit[];
  /** Ticked days per habit id. */
  checks: Map<number, Set<Day>>;
  /** Days the user went through: something ticked, or "nothing kept" said explicitly (see filledDays). */
  filled: Set<Day>;
  settings: Settings;
  /** Sorted by time. */
  reminders: Reminder[];
};

/**
 * A day is filled in when at least one habit is ticked on it, or when the user said nothing was
 * kept ("Rien de tenu ce jour-là"). Computed rather than stored, so unticking a mistaken tick
 * leaves the day as it was. Only the explicit "nothing kept" days are stored (filled_days), and a
 * tick cancels that day's mark (see setChecked).
 */
export function filledDays(explicit: Iterable<Day>, checks: Map<number, Set<Day>>): Set<Day> {
  const filled = new Set(explicit);
  for (const days of checks.values()) for (const day of days) filled.add(day);
  return filled;
}

export function historyOf(snapshot: Snapshot, habit: Habit): HabitHistory {
  return { start: habit.startDay, checked: snapshot.checks.get(habit.id) ?? new Set() };
}

/** Habits shown for a given day: active, and already started by then. */
export function habitsOn(snapshot: Snapshot, day: Day): Habit[] {
  return snapshot.habits.filter((h) => h.archivedAt === null && h.startDay <= day);
}
