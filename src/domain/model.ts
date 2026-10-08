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
  /** Days with at least one tick: a day is "done" (no more reminders) once it's in here. */
  tickedDays: Set<Day>;
  settings: Settings;
  /** Sorted by time. */
  reminders: Reminder[];
};

/** Days with at least one tick, any habit. */
export function tickedDays(checks: Map<number, Set<Day>>): Set<Day> {
  const days = new Set<Day>();
  for (const habitDays of checks.values()) for (const day of habitDays) days.add(day);
  return days;
}

export function historyOf(snapshot: Snapshot, habit: Habit): HabitHistory {
  return { start: habit.startDay, checked: snapshot.checks.get(habit.id) ?? new Set() };
}

/** Habits shown for a given day: active, and already started by then. */
export function habitsOn(snapshot: Snapshot, day: Day): Habit[] {
  return snapshot.habits.filter((h) => h.archivedAt === null && h.startDay <= day);
}
