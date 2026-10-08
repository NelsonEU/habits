import {
  addDays,
  addMonths,
  type Day,
  eachDay,
  firstDayOfMonth,
  lastDayOfMonth,
  maxDay,
  minDay,
  type Month,
  monthOf,
  weekdayOf,
} from './day';

/** What the stats need to know about one habit. */
export type HabitHistory = {
  /** First day the habit counts for. Days before it are never "missed". */
  start: Day;
  /** Days on which the habit was ticked. */
  checked: ReadonlySet<Day>;
};

/** Share of days ticked. `ratio` is null when the period has no countable day. */
export type Rate = { done: number; total: number; ratio: number | null };

/**
 * The last day that counts for stats. Today only counts once ticked: the
 * evening check-in hasn't happened yet, so an unticked today isn't a miss.
 */
export function effectiveEnd(h: HabitHistory, today: Day): Day {
  return h.checked.has(today) ? today : addDays(today, -1);
}

export function rate(h: HabitHistory, from: Day, to: Day): Rate {
  let done = 0;
  let total = 0;
  for (const day of eachDay(maxDay(from, h.start), to)) {
    total++;
    if (h.checked.has(day)) done++;
  }
  return { done, total, ratio: total === 0 ? null : done / total };
}

export function currentStreak(h: HabitHistory, today: Day): number {
  let n = 0;
  for (let d = effectiveEnd(h, today); h.checked.has(d); d = addDays(d, -1)) n++;
  return n;
}

export type Streak = { length: number; start: Day; end: Day };

/** Longest run of consecutive ticked days. On a tie, the first one reached stays the record. */
export function bestStreak(h: HabitHistory): Streak | null {
  const days = [...h.checked].sort();
  let best: Streak | null = null;
  let runStart = 0;
  for (let i = 0; i < days.length; i++) {
    if (i > 0 && addDays(days[i - 1], 1) !== days[i]) runStart = i;
    const isRunEnd = i === days.length - 1 || addDays(days[i], 1) !== days[i + 1];
    if (!isRunEnd) continue;
    const length = i - runStart + 1;
    if (!best || length > best.length) best = { length, start: days[runStart], end: days[i] };
  }
  return best;
}

/** Rate over the last 30 days, and over the 30 days before, for the trend. */
export function last30Days(h: HabitHistory, today: Day): { current: Rate; previous: Rate } {
  const end = effectiveEnd(h, today);
  const from = addDays(end, -29);
  return {
    current: rate(h, from, end),
    previous: rate(h, addDays(from, -30), addDays(from, -1)),
  };
}

/** The 12 complete months before the current one (Oct 2025 – Sep 2026 on 7 Oct 2026). */
export function lastTwelveMonths(today: Day): { months: Month[]; from: Day; to: Day } {
  const current = monthOf(today);
  const months = Array.from({ length: 12 }, (_, i) => addMonths(current, i - 12));
  return { months, from: firstDayOfMonth(months[0]), to: lastDayOfMonth(months[11]) };
}

export function monthlyRates(h: HabitHistory, today: Day): (Rate & { month: Month })[] {
  return lastTwelveMonths(today).months.map((month) => ({
    month,
    ...rate(h, firstDayOfMonth(month), lastDayOfMonth(month)),
  }));
}

/** One entry per calendar year since the habit started; the current year runs to date. */
export function yearlyRates(h: HabitHistory, today: Day): (Rate & { year: number })[] {
  const end = effectiveEnd(h, today);
  const out: (Rate & { year: number })[] = [];
  for (let year = Number(h.start.slice(0, 4)); year <= Number(today.slice(0, 4)); year++) {
    out.push({ year, ...rate(h, `${year}-01-01`, minDay(`${year}-12-31`, end)) });
  }
  return out;
}

/** Rates per weekday over a period, Monday first (index 0) to Sunday (index 6). */
export function weekdayRates(h: HabitHistory, from: Day, to: Day): Rate[] {
  const counts = Array.from({ length: 7 }, () => ({ done: 0, total: 0 }));
  for (const day of eachDay(maxDay(from, h.start), to)) {
    const c = counts[weekdayOf(day)];
    c.total++;
    if (h.checked.has(day)) c.done++;
  }
  return counts.map(({ done, total }) => ({ done, total, ratio: total === 0 ? null : done / total }));
}

/**
 * Indexes of the hardest and easiest entries of a list of rates (e.g. weekdays).
 * Null when there's nothing to tell apart: fewer than two rates, or all equal.
 */
export function extremes(rates: Rate[]): { hardest: number; easiest: number } | null {
  const known = rates.map((r, i) => ({ ratio: r.ratio, i })).filter((r): r is { ratio: number; i: number } => r.ratio !== null);
  if (known.length < 2) return null;
  const hardest = known.reduce((a, b) => (b.ratio < a.ratio ? b : a));
  const easiest = known.reduce((a, b) => (b.ratio > a.ratio ? b : a));
  return hardest.ratio === easiest.ratio ? null : { hardest: hardest.i, easiest: easiest.i };
}
