import { dayTitle, longDay, streakLabel, weekdayLetter, weekLabel } from './format';

const TODAY = '2026-10-07';

test('dayTitle', () => {
  expect(dayTitle(TODAY, TODAY)).toBe('Aujourd’hui');
  expect(dayTitle('2026-10-06', TODAY)).toBe('Hier');
  expect(dayTitle('2026-10-05', TODAY)).toBe('Lundi 5 octobre');
});

test('longDay', () => {
  expect(longDay('2026-08-01')).toBe('Samedi 1 août');
});

test('weekdayLetter', () => {
  expect(weekdayLetter('2026-10-05')).toBe('L');
  expect(weekdayLetter('2026-10-11')).toBe('D');
});

test('weekLabel', () => {
  expect(weekLabel('2026-10-05', '2026-10-11')).toBe('Octobre 2026');
  expect(weekLabel('2026-09-28', '2026-10-04')).toBe('Sept. – oct. 2026');
  expect(weekLabel('2025-12-29', '2026-01-04')).toBe('Déc. 2025 – janv. 2026');
});

test('streakLabel', () => {
  expect(streakLabel(0)).toBe('Pas de série en cours');
  expect(streakLabel(1)).toBe('1 jour d’affilée');
  expect(streakLabel(12)).toBe('12 jours d’affilée');
});
