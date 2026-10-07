import { type Day, minDay } from '@/domain/day';
import { nearestHabitColor } from '@/domain/palette';
import { ImportError } from './errors';

/**
 * Daygraph backup format (a Flutter app):
 * - tasks[].color is an ARGB integer (4294941273 = 0xFFFF9A59)
 * - histories[].date is the timestamp of local midnight, in whatever timezone
 *   the phone was in that day (it changes when travelling).
 */
type DaygraphTask = { id: number; title: string; color: string | number; order: number; positive: boolean };
type DaygraphHistory = { id: number; task: number; date: number };

export type ImportedHabit = { sourceId: number; name: string; color: string; sortOrder: number };

export type DaygraphImport = {
  habits: ImportedHabit[];
  checks: { sourceId: number; day: Day }[];
  /** First ticked day of the backup (null if empty): imported habits count from there. */
  firstDay: Day | null;
  /** Ticks dropped because the same habit was already ticked that day. */
  duplicates: number;
};

/**
 * Midnight in any timezone from UTC−12 to UTC+11 falls within 12 hours of
 * that day's UTC midnight, so shifting by 12 hours and reading the UTC date
 * recovers the calendar day without knowing the timezone.
 */
export function daygraphDateToDay(timestamp: number): Day {
  return new Date(timestamp + 12 * 3_600_000).toISOString().slice(0, 10);
}

/** ARGB integer (as number or string) to "#RRGGBB". */
export function argbToHex(argb: string | number): string {
  const value = Number(argb);
  if (!Number.isInteger(value)) throw new ImportError('invalid-daygraph');
  return '#' + (value & 0xffffff).toString(16).padStart(6, '0').toUpperCase();
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function readTask(raw: unknown): DaygraphTask {
  if (
    !isObject(raw) ||
    typeof raw.id !== 'number' ||
    typeof raw.title !== 'string' ||
    typeof raw.order !== 'number' ||
    (typeof raw.color !== 'string' && typeof raw.color !== 'number')
  ) {
    throw new ImportError('invalid-daygraph');
  }
  if (raw.positive === false) {
    // A negative habit means "ticked = failed": importing it as-is would invert its stats.
    throw new ImportError('negative-habit', { name: raw.title });
  }
  return raw as DaygraphTask;
}

function readHistory(raw: unknown): DaygraphHistory {
  if (!isObject(raw) || typeof raw.task !== 'number' || typeof raw.date !== 'number') {
    throw new ImportError('invalid-daygraph');
  }
  return raw as DaygraphHistory;
}

export function isDaygraphBackup(json: unknown): boolean {
  return isObject(json) && Array.isArray(json.tasks) && Array.isArray(json.histories);
}

export function parseDaygraph(json: unknown): DaygraphImport {
  if (!isObject(json) || !Array.isArray(json.tasks) || !Array.isArray(json.histories)) {
    throw new ImportError('unknown-format');
  }
  const tasks = json.tasks.map(readTask);
  const taskIds = new Set(tasks.map((t) => t.id));

  const seen = new Set<string>();
  const checks: DaygraphImport['checks'] = [];
  let duplicates = 0;
  let firstDay: Day | null = null;
  for (const history of json.histories.map(readHistory)) {
    if (!taskIds.has(history.task)) throw new ImportError('invalid-daygraph');
    const day = daygraphDateToDay(history.date);
    const key = `${history.task}|${day}`;
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    checks.push({ sourceId: history.task, day });
    firstDay = firstDay === null ? day : minDay(firstDay, day);
  }

  return {
    habits: [...tasks]
      .sort((a, b) => a.order - b.order)
      .map((t, i) => ({ sourceId: t.id, name: t.title.trim(), color: nearestHabitColor(argbToHex(t.color)), sortOrder: i })),
    checks,
    firstDay,
    duplicates,
  };
}
