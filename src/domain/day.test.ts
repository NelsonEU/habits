import { addDays, addMonths, daysBetween, eachDay, isDay, lastDayOfMonth, toDay, weekdayOf } from './day';

describe('day', () => {
  test('addDays crosses month, year and DST boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30'); // DST starts in Europe
    expect(addDays('2026-10-25', -1)).toBe('2026-10-24'); // DST ends in Europe
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
  });

  test('daysBetween', () => {
    expect(daysBetween('2026-10-01', '2026-10-07')).toBe(6);
    expect(daysBetween('2026-10-07', '2026-10-01')).toBe(-6);
    expect(daysBetween('2024-01-01', '2025-01-01')).toBe(366);
  });

  test('weekdayOf is Monday-first', () => {
    expect(weekdayOf('2026-10-05')).toBe(0); // Monday
    expect(weekdayOf('2026-10-07')).toBe(2); // Wednesday
    expect(weekdayOf('2026-10-11')).toBe(6); // Sunday
  });

  test('eachDay includes both ends', () => {
    expect(eachDay('2026-09-29', '2026-10-01')).toEqual(['2026-09-29', '2026-09-30', '2026-10-01']);
    expect(eachDay('2026-10-02', '2026-10-01')).toEqual([]);
  });

  test('months', () => {
    expect(addMonths('2026-10', -10)).toBe('2025-12');
    expect(addMonths('2025-12', 1)).toBe('2026-01');
    expect(lastDayOfMonth('2024-02')).toBe('2024-02-29');
    expect(lastDayOfMonth('2026-02')).toBe('2026-02-28');
  });

  test('isDay rejects impossible dates', () => {
    expect(isDay('2026-10-07')).toBe(true);
    expect(isDay('2026-02-30')).toBe(false);
    expect(isDay('2026-10-7')).toBe(false);
  });

  test('toDay uses local calendar fields', () => {
    expect(toDay(new Date(2026, 9, 7, 23, 59))).toBe('2026-10-07');
  });
});
