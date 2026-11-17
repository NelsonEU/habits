import { toDay } from './day';
import { habitsOn, type Snapshot } from './model';

/** iOS keeps at most 64 pending notifications per app; stay under it. */
const MAX_SCHEDULED = 60;

/** A notification to schedule: for one habit, or general (habitId null). */
export type ReminderMoment = { date: Date; habitId: number | null };

/**
 * The moments to schedule notifications for: every reminder time on each of
 * the next `days` days (today included), except times already past, and:
 * - a general reminder stays quiet on a day once every habit of that day is ticked
 *   (or when there's no habit at all);
 * - a habit's reminder stays quiet once that habit is ticked, and while it's archived
 *   or not started yet.
 * Earliest first, capped for iOS.
 *
 * iOS can't skip a repeating notification on one day, so reminders are
 * scheduled one by one, and rescheduled whenever the app opens or something is ticked.
 */
export function reminderMoments(
  snapshot: Pick<Snapshot, 'reminders' | 'habits' | 'checks'>,
  now: Date,
  days = 14,
): ReminderMoment[] {
  const moments: ReminderMoment[] = [];
  for (let offset = 0; offset < days; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const day = toDay(date);
    const active = habitsOn(snapshot, day);
    const ticked = (habitId: number) => snapshot.checks.get(habitId)?.has(day) ?? false;
    const allTicked = active.every((h) => ticked(h.id));
    for (const { time, habitId } of snapshot.reminders) {
      const quiet = habitId === null ? allTicked : !active.some((h) => h.id === habitId) || ticked(habitId);
      if (quiet) continue;
      const [hours, minutes] = time.split(':').map(Number);
      const moment = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
      if (moment > now) moments.push({ date: moment, habitId });
    }
  }
  return moments.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, MAX_SCHEDULED);
}

/** A valid reminder time, "HH:MM" on a 24-hour clock. */
export const isTime = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

/** A whole hour for a new reminder: `fromHour`, or the next one not already taken. */
export function freeHour(taken: Iterable<string>, fromHour: number): string {
  const used = new Set(taken);
  const at = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`;
  let hour = fromHour;
  while (used.has(at(hour)) && hour < fromHour + 23) hour++;
  return at(hour);
}

/** "HH:MM" for a reminder time picked as a Date. */
export const toTime = (date: Date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

/** A Date today at a reminder's time, for the time picker. */
export function fromTime(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}
