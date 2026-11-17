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

export type Settings = {
  weekStartsOn: WeekStart;
  theme: ThemePreference;
  /** The first-launch welcome page was completed or skipped. */
  welcomeDone: boolean;
};

export const DEFAULT_SETTINGS: Settings = { weekStartsOn: 'monday', theme: 'system', welcomeDone: false };

/**
 * A daily reminder at a local time, "HH:MM". General (habitId null) until every habit
 * of the day is ticked, or for one habit until that habit is ticked.
 */
export type Reminder = { id: number; time: string; habitId: number | null };

/** All the app's data, loaded in memory. */
export type Snapshot = {
  /** Every habit, archived ones included, in display order. */
  habits: Habit[];
  /** Ticked days per habit id. */
  checks: Map<number, Set<Day>>;
  settings: Settings;
  /** General and per-habit ones, sorted by time. */
  reminders: Reminder[];
};

export function historyOf(snapshot: Snapshot, habit: Habit): HabitHistory {
  return { start: habit.startDay, checked: snapshot.checks.get(habit.id) ?? new Set() };
}

/** Habits shown for a given day: active, and already started by then. */
export function habitsOn(snapshot: Pick<Snapshot, 'habits'>, day: Day): Habit[] {
  return snapshot.habits.filter((h) => h.archivedAt === null && h.startDay <= day);
}
