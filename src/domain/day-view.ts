import { type Day, minDay, startOfWeek } from './day';
import { habitsOn, type Snapshot } from './model';

/** One dot per habit under each day of the week strip: ticked or not. */
export type Dot = { color: string; state: 'done' | 'missed' };

export function dayDots(snapshot: Snapshot, day: Day, today: Day): Dot[] {
  if (day > today) return [];
  return habitsOn(snapshot, day).map((h) => ({
    color: h.color,
    state: snapshot.checks.get(h.id)?.has(day) ? 'done' : 'missed',
  }));
}

/** Week strip navigation bounds: from the earliest habit's first week to the current week. */
export function weekBounds(snapshot: Snapshot, today: Day, weekStartsOn: 'monday' | 'sunday') {
  const earliest = snapshot.habits.reduce((min, h) => minDay(min, h.startDay), today);
  return { first: startOfWeek(earliest, weekStartsOn), last: startOfWeek(today, weekStartsOn) };
}
