import { addDays, type Day, weekdayOf } from './day';

/*
 * French date labels, written out rather than taken from Intl so they match
 * the mockup exactly on every device.
 */
const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const parts = (day: Day) => day.split('-').map(Number);

/** One-letter weekday, Monday = 0: "L", "M", "M", "J", "V", "S", "D". */
export const weekdayLetter = (day: Day) => 'LMMJVSD'[weekdayOf(day)];

/** "Lundi 5 octobre" */
export function longDay(day: Day): string {
  const [, m, d] = parts(day);
  return `${capitalize(DAY_NAMES[weekdayOf(day)])} ${d} ${MONTH_NAMES[m - 1]}`;
}

/** "Aujourd’hui", "Hier", or "Lundi 5 octobre". */
export function dayTitle(day: Day, today: Day): string {
  if (day === today) return 'Aujourd’hui';
  if (day === addDays(today, -1)) return 'Hier';
  return longDay(day);
}

/** Week strip label: "Octobre 2026", "Sept. – oct. 2026", "Déc. 2025 – janv. 2026". */
export function weekLabel(first: Day, last: Day): string {
  const [y1, m1] = parts(first);
  const [y2, m2] = parts(last);
  if (y1 === y2 && m1 === m2) return `${capitalize(MONTH_NAMES[m1 - 1])} ${y1}`;
  if (y1 === y2) return `${capitalize(MONTH_SHORT[m1 - 1])} – ${MONTH_SHORT[m2 - 1]} ${y1}`;
  return `${capitalize(MONTH_SHORT[m1 - 1])} ${y1} – ${MONTH_SHORT[m2 - 1]} ${y2}`;
}

/** "1 jour d’affilée", "12 jours d’affilée", or "Pas de série en cours". */
export function streakLabel(n: number): string {
  if (n === 0) return 'Pas de série en cours';
  return `${n} ${n > 1 ? 'jours' : 'jour'} d’affilée`;
}
