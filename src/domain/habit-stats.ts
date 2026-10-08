import { calendarWeeks } from './calendar';
import type { Day } from './day';
import { type Habit, historyOf, type Snapshot } from './model';
import {
  bestStreak,
  currentStreak,
  extremes,
  last30Days,
  lastTwelveMonths,
  monthlyRates,
  weekdayRates,
  yearlyRates,
} from './stats';

/** Everything the statistics screens show for one habit, in the brief's order. */
export function habitStats(snapshot: Snapshot, habit: Habit, today: Day, weekStartsOn: 'monday' | 'sunday') {
  const history = historyOf(snapshot, habit);
  const { current, previous } = last30Days(history, today);
  const twelveMonths = lastTwelveMonths(today);
  // Monday-first from the stats, reordered to start on the week's first day.
  const weekdayOrder = weekStartsOn === 'monday' ? [0, 1, 2, 3, 4, 5, 6] : [6, 0, 1, 2, 3, 4, 5];
  const weekdayAll = weekdayRates(history, twelveMonths.from, twelveMonths.to);
  const weekdays = weekdayOrder.map((index) => ({ index, rate: weekdayAll[index] }));
  const weekdayExtremes = extremes(weekdays.map((w) => w.rate));

  return {
    // 1 · Where I stand
    streak: currentStreak(history, today),
    record: bestStreak(history),
    last30: current,
    last30Previous: previous,
    // 2 · Am I improving?
    months: monthlyRates(history, today),
    years: yearlyRates(history, today).filter((y) => y.ratio !== null),
    // 3 · Which days are hard? (positions in `weekdays`, not weekday indexes)
    weekdays,
    weekdayExtremes,
    // 4 · Day by day
    calendar: calendarWeeks(history, snapshot.filled, today, weekStartsOn),
  };
}
