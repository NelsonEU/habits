import type { Day } from '@/domain/day';

/*
 * Date labels in the user's language, from the platform's Intl data. Days are
 * turned into a local Date at noon, so no timezone can move them to the
 * previous or next day.
 */
const toDate = (day: Day) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};
const format = (day: Day, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, options).format(toDate(day));
const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1);

/** One-letter weekday: "L" for lundi, "M" for Monday. */
export const weekdayLetter = (day: Day, locale: string) =>
  format(day, locale, { weekday: 'narrow' }).toLocaleUpperCase(locale);

/** "Lundi 5 octobre", "Monday, October 5". */
export const longDay = (day: Day, locale: string) =>
  capitalize(format(day, locale, { weekday: 'long', day: 'numeric', month: 'long' }));

/** Week strip label: "Octobre 2026", "Sept. – oct. 2026", "Déc. 2025 – janv. 2026" (or the English equivalents). */
export function weekLabel(first: Day, last: Day, locale: string): string {
  const sameYear = first.slice(0, 4) === last.slice(0, 4);
  if (first.slice(0, 7) === last.slice(0, 7)) return capitalize(format(first, locale, { month: 'long', year: 'numeric' }));
  const start = format(first, locale, sameYear ? { month: 'short' } : { month: 'short', year: 'numeric' });
  const end = format(last, locale, { month: 'short', year: 'numeric' });
  return `${capitalize(start)} – ${end}`;
}

/** "5 janv. 2024", "Jan 5, 2024". */
export const shortDate = (day: Day, locale: string) => format(day, locale, { day: 'numeric', month: 'short', year: 'numeric' });

/** "87 %" in French, "87%" in English. */
export const percent = (ratio: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(ratio);

const monthDay = (month: string) => `${month}-01`;

/** Month initial, for chart axes: "O" for octobre / October. */
export const monthLetter = (month: string, locale: string) =>
  format(monthDay(month), locale, { month: 'narrow' }).toLocaleUpperCase(locale);

/** Short month, for calendar labels: "oct.", "Oct". */
export const monthShort = (month: string, locale: string) => format(monthDay(month), locale, { month: 'short' });

/** "octobre 2025", "October 2025". */
export const monthYear = (month: string, locale: string) => format(monthDay(month), locale, { month: 'long', year: 'numeric' });

/** Weekday name, Monday = 0: "Lun.", "Mon". */
export const weekdayShort = (index: number, locale: string) =>
  capitalize(format(`2026-10-0${5 + index}`, locale, { weekday: 'short' }));

/** Weekday name in a sentence, Monday = 0: "le vendredi" needs "vendredi", "Friday" stays capitalized. */
export const weekdayLong = (index: number, locale: string) => format(`2026-10-0${5 + index}`, locale, { weekday: 'long' });
