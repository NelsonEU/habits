import { type Day, toDay } from './day';
import type { Reminder } from './model';

/** iOS keeps at most 64 pending notifications per app; stay under it. */
const MAX_SCHEDULED = 60;

/**
 * The moments to schedule notifications for: every reminder time on each of
 * the next `days` days (today included), except times already past and every
 * reminder of a day already done (something ticked). Earliest first, capped for iOS.
 *
 * iOS can't skip a repeating notification on one day, so reminders are
 * scheduled one by one, and rescheduled whenever the app opens or something is ticked.
 */
export function reminderMoments(reminders: Reminder[], doneDays: ReadonlySet<Day>, now: Date, days = 14): Date[] {
  const moments: Date[] = [];
  for (let offset = 0; offset < days; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (doneDays.has(toDay(date))) continue;
    for (const { time } of reminders) {
      const [hours, minutes] = time.split(':').map(Number);
      const moment = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
      if (moment > now) moments.push(moment);
    }
  }
  return moments.sort((a, b) => a.getTime() - b.getTime()).slice(0, MAX_SCHEDULED);
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
