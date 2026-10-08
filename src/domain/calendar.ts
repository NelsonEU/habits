import { addDays, type Day, startOfWeek } from './day';
import type { HabitHistory } from './stats';

/**
 * One cell of the "day by day" calendar:
 * - done / missed: ticked or not, on a day that counts
 * - forgotten: a past day nobody filled in (counted as missed by the stats, shown apart)
 * - outside: before the habit started, or after today
 */
export type CalendarCell = { day: Day; state: 'done' | 'missed' | 'forgotten' | 'outside'; isToday: boolean };

/**
 * The last `weeks` weeks as columns of 7 cells (first column = oldest week),
 * each column starting on the week's first day.
 */
export function calendarWeeks(
  h: HabitHistory,
  filled: ReadonlySet<Day>,
  today: Day,
  weekStartsOn: 'monday' | 'sunday',
  weeks = 26,
): CalendarCell[][] {
  const firstWeek = addDays(startOfWeek(today, weekStartsOn), -7 * (weeks - 1));
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const day = addDays(firstWeek, 7 * w + d);
      const state: CalendarCell['state'] =
        day > today || day < h.start
          ? 'outside'
          : h.checked.has(day)
            ? 'done'
            : filled.has(day) || day === today
              ? 'missed'
              : 'forgotten';
      return { day, state, isToday: day === today };
    }),
  );
}
