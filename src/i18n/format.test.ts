import { longDay, weekdayLetter, weekLabel } from './format';

describe.each([
  ['fr-FR', 'Lundi 5 octobre', ['L', 'D'], ['Octobre 2026', 'Sept. – oct. 2026', 'Déc. 2025 – janv. 2026']],
  ['en-US', 'Monday, October 5', ['M', 'S'], ['October 2026', 'Sep – Oct 2026', 'Dec 2025 – Jan 2026']],
])('%s', (locale, monday, [mondayLetter, sundayLetter], [sameMonth, twoMonths, twoYears]) => {
  test('longDay', () => {
    expect(longDay('2026-10-05', locale)).toBe(monday);
  });

  test('weekdayLetter', () => {
    expect(weekdayLetter('2026-10-05', locale)).toBe(mondayLetter);
    expect(weekdayLetter('2026-10-11', locale)).toBe(sundayLetter);
  });

  test('weekLabel', () => {
    expect(weekLabel('2026-10-05', '2026-10-11', locale)).toBe(sameMonth);
    expect(weekLabel('2026-09-28', '2026-10-04', locale)).toBe(twoMonths);
    expect(weekLabel('2025-12-29', '2026-01-04', locale)).toBe(twoYears);
  });
});
