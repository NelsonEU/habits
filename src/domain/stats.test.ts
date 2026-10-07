import { eachDay } from './day';
import {
  bestStreak,
  currentStreak,
  deltaPoints,
  type HabitHistory,
  last30Days,
  lastTwelveMonths,
  monthlyRates,
  rate,
  weekdayRates,
  yearlyRates,
} from './stats';

const habit = (start: string, checked: string[]): HabitHistory => ({ start, checked: new Set(checked) });
const TODAY = '2026-10-07';

describe('currentStreak', () => {
  test('an unticked today does not break the streak', () => {
    expect(currentStreak(habit('2026-01-01', ['2026-10-05', '2026-10-06']), TODAY)).toBe(2);
  });

  test('a ticked today extends it', () => {
    expect(currentStreak(habit('2026-01-01', ['2026-10-05', '2026-10-06', TODAY]), TODAY)).toBe(3);
  });

  test('a missed yesterday ends it', () => {
    expect(currentStreak(habit('2026-01-01', ['2026-10-05', TODAY]), TODAY)).toBe(1);
    expect(currentStreak(habit('2026-01-01', ['2026-10-05']), TODAY)).toBe(0);
  });
});

describe('bestStreak', () => {
  test('finds the longest run with its dates', () => {
    const h = habit('2026-01-01', ['2026-01-01', '2026-01-02', '2026-03-01', '2026-03-02', '2026-03-03', '2026-05-01']);
    expect(bestStreak(h)).toEqual({ length: 3, start: '2026-03-01', end: '2026-03-03' });
  });

  test('keeps the first run on a tie, and handles unsorted input', () => {
    const h = habit('2026-01-01', ['2026-05-02', '2026-01-02', '2026-05-01', '2026-01-01']);
    expect(bestStreak(h)).toEqual({ length: 2, start: '2026-01-01', end: '2026-01-02' });
  });

  test('runs across a month boundary', () => {
    expect(bestStreak(habit('2026-01-01', eachDay('2026-01-30', '2026-02-02')))?.length).toBe(4);
  });

  test('null without ticks', () => {
    expect(bestStreak(habit('2026-01-01', []))).toBeNull();
  });
});

describe('rate', () => {
  test('ignores days before the habit started', () => {
    const r = rate(habit('2026-09-21', ['2026-09-21', '2026-09-22']), '2026-09-01', '2026-09-30');
    expect(r).toEqual({ done: 2, total: 10, ratio: 0.2 });
  });

  test('null ratio when the habit had not started yet', () => {
    expect(rate(habit('2026-10-01', []), '2026-09-01', '2026-09-30').ratio).toBeNull();
  });
});

describe('last30Days', () => {
  test('ends yesterday until today is ticked', () => {
    const days = eachDay('2026-09-07', '2026-10-06'); // the 30 days before today
    expect(last30Days(habit('2026-01-01', days), TODAY).current).toEqual({ done: 30, total: 30, ratio: 1 });
    expect(last30Days(habit('2026-01-01', [...days, TODAY]), TODAY).current).toEqual({ done: 30, total: 30, ratio: 1 });
  });

  test('previous period is the 30 days before', () => {
    const h = habit('2026-01-01', eachDay('2026-08-08', '2026-08-22')); // 15 of the previous 30
    const { current, previous } = last30Days(h, TODAY);
    expect(previous.ratio).toBe(0.5);
    expect(deltaPoints(current, previous)).toBe(-50);
  });
});

describe('monthly and yearly rates', () => {
  test('the 12 complete months before the current one', () => {
    const { months, from, to } = lastTwelveMonths(TODAY);
    expect(months[0]).toBe('2025-10');
    expect(months[11]).toBe('2026-09');
    expect([from, to]).toEqual(['2025-10-01', '2026-09-30']);
  });

  test('a month before the start has no rate', () => {
    const rates = monthlyRates(habit('2026-09-16', eachDay('2026-09-16', '2026-09-30')), TODAY);
    expect(rates[10].ratio).toBeNull();
    expect(rates[11]).toMatchObject({ month: '2026-09', done: 15, total: 15, ratio: 1 });
  });

  test('years run from the start, the current one to date', () => {
    const h = habit('2025-12-31', ['2025-12-31', '2026-01-01']);
    const [y2025, y2026] = yearlyRates(h, TODAY);
    expect(y2025).toMatchObject({ year: 2025, done: 1, total: 1 });
    expect(y2026).toMatchObject({ year: 2026, done: 1, total: 279 }); // 1 Jan – 6 Oct
  });
});

describe('weekdayRates', () => {
  test('Monday first', () => {
    // 5 – 11 Oct 2026 is Monday – Sunday; tick Monday and Friday only
    const rates = weekdayRates(habit('2026-01-01', ['2026-10-05', '2026-10-09']), '2026-10-05', '2026-10-11');
    expect(rates.map((r) => r.ratio)).toEqual([1, 0, 0, 0, 1, 0, 0]);
  });
});
