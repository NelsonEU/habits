import { type Day, isDay } from '@/domain/day';
import type { Snapshot } from '@/domain/model';
import { HABIT_COLORS, LEGACY_COLORS, nearestHabitColor } from '@/domain/palette';
import type { DaygraphImport } from './daygraph';
import { ImportError } from './errors';

/** Everything an import can bring, whatever the file it came from. */
export type Backup = {
  habits: BackupHabit[];
  /** Days the user went through (see Snapshot.filled). */
  filledDays: Day[];
};

export type BackupHabit = {
  /** Permanent id from this app's export; null for other sources (e.g. Daygraph). */
  uid: string | null;
  name: string;
  color: string;
  startDay: Day;
  archivedAt: string | null;
  /** Ticked days, sorted. */
  checks: Day[];
};

/*
 * This app's export file. Bump VERSION when the shape changes, and keep reading
 * older versions in parseBackupFile.
 */
const APP = 'habits';
const VERSION = 1;

type BackupFile = {
  app: typeof APP;
  version: number;
  exportedAt: string;
  habits: (BackupHabit & { uid: string })[];
  filledDays: Day[];
};

/** The whole app as an export file (JSON text). Habits in display order. */
export function toBackupFile(snapshot: Snapshot, exportedAt: Date): string {
  const file: BackupFile = {
    app: APP,
    version: VERSION,
    exportedAt: exportedAt.toISOString(),
    habits: snapshot.habits.map((h) => ({
      uid: h.uid,
      name: h.name,
      color: h.color,
      startDay: h.startDay,
      archivedAt: h.archivedAt,
      checks: [...(snapshot.checks.get(h.id) ?? [])].sort(),
    })),
    filledDays: [...snapshot.filled].sort(),
  };
  return JSON.stringify(file, null, 2);
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isDayList = (v: unknown): v is Day[] => Array.isArray(v) && v.every((d) => typeof d === 'string' && isDay(d));
const PALETTE = new Set<string>(HABIT_COLORS.map((c) => c.hex));

/**
 * A color from a file, as one of the app's: files from before the palette change carry the old
 * colors, and a hand-edited file could hold any color.
 */
function paletteColor(color: string): string {
  const upper = color.toUpperCase();
  if (PALETTE.has(upper)) return upper;
  return LEGACY_COLORS[upper] ?? nearestHabitColor(upper);
}

export function isBackupFile(json: unknown): boolean {
  return isObject(json) && json.app === APP;
}

export function parseBackupFile(json: unknown): Backup {
  if (!isObject(json) || json.app !== APP) throw new ImportError('unknown-format');
  if (typeof json.version !== 'number' || json.version > VERSION) throw new ImportError('newer-version');
  if (!Array.isArray(json.habits) || !isDayList(json.filledDays)) throw new ImportError('invalid-backup');

  const habits = json.habits.map((raw): BackupHabit => {
    if (
      !isObject(raw) ||
      typeof raw.uid !== 'string' ||
      typeof raw.name !== 'string' ||
      raw.name.trim() === '' ||
      typeof raw.color !== 'string' ||
      !/^#[0-9A-Fa-f]{6}$/.test(raw.color) ||
      typeof raw.startDay !== 'string' ||
      !isDay(raw.startDay) ||
      !(raw.archivedAt === null || typeof raw.archivedAt === 'string') ||
      !isDayList(raw.checks)
    ) {
      throw new ImportError('invalid-backup');
    }
    return {
      uid: raw.uid,
      name: raw.name.trim(),
      color: paletteColor(raw.color),
      startDay: raw.startDay,
      archivedAt: raw.archivedAt,
      checks: [...new Set(raw.checks)].sort(),
    };
  });
  if (new Set(habits.map((h) => h.uid)).size !== habits.length) throw new ImportError('invalid-backup');
  return { habits, filledDays: [...new Set(json.filledDays)].sort() };
}

/**
 * A Daygraph backup as a Backup. Daygraph doesn't record filled-in days, so
 * only days with at least one tick count as filled; every habit starts on the
 * backup's first day.
 */
export function daygraphToBackup(data: DaygraphImport, today: Day): Backup {
  const startDay = data.firstDay ?? today;
  const habits = data.habits.map((h) => ({
    uid: null,
    name: h.name,
    color: h.color,
    startDay,
    archivedAt: null,
    checks: data.checks
      .filter((c) => c.sourceId === h.sourceId)
      .map((c) => c.day)
      .sort(),
  }));
  return { habits, filledDays: [...new Set(data.checks.map((c) => c.day))].sort() };
}

/** What the import screen shows before anything is changed. */
export function summarize(backup: Backup) {
  const days = backup.habits.flatMap((h) => h.checks);
  const sorted = [...days].sort();
  return {
    habits: backup.habits.length,
    checks: days.length,
    first: sorted[0] ?? null,
    last: sorted.at(-1) ?? null,
  };
}

