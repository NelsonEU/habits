/**
 * A calendar day, as "YYYY-MM-DD".
 *
 * Habits are ticked on calendar days, not at instants: storing timestamps
 * would let timezone changes and DST move ticks to another day. All day math
 * below goes through UTC midnight, where every day is exactly 24 hours long.
 */
export type Day = string;

const MS_PER_DAY = 86_400_000;
const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

export function isDay(value: string): value is Day {
  const m = DAY_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** The local calendar day of a JS Date, in the phone's current timezone. */
export function toDay(date: Date): Day {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toUTCms(day: Day): number {
  const [y, m, d] = day.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUTCms(ms: number): Day {
  const date = new Date(ms);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(day: Day, n: number): Day {
  return fromUTCms(toUTCms(day) + n * MS_PER_DAY);
}

/** Number of days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: Day, to: Day): number {
  return Math.round((toUTCms(to) - toUTCms(from)) / MS_PER_DAY);
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayOf(day: Day): number {
  return (new Date(toUTCms(day)).getUTCDay() + 6) % 7;
}

/** Every day from `from` to `to`, both included. Empty if `to` is before `from`. */
export function eachDay(from: Day, to: Day): Day[] {
  const out: Day[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

export const minDay = (a: Day, b: Day): Day => (a < b ? a : b);
export const maxDay = (a: Day, b: Day): Day => (a > b ? a : b);

/** "2026-10" for a day in October 2026. */
export type Month = string;

export const monthOf = (day: Day): Month => day.slice(0, 7);
export const firstDayOfMonth = (month: Month): Day => `${month}-01`;

export function addMonths(month: Month, n: number): Month {
  const [y, m] = month.split('-').map(Number);
  const total = y * 12 + (m - 1) + n;
  return `${pad(Math.floor(total / 12), 4)}-${pad((total % 12) + 1)}`;
}

export function lastDayOfMonth(month: Month): Day {
  return addDays(firstDayOfMonth(addMonths(month, 1)), -1);
}
