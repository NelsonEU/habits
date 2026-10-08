import { tickedDays } from './model';

describe('tickedDays', () => {
  test('every day with at least one tick, any habit', () => {
    const checks = new Map([
      [1, new Set(['2026-10-01', '2026-10-02'])],
      [2, new Set(['2026-10-02', '2026-10-05'])],
    ]);
    expect([...tickedDays(checks)].sort()).toEqual(['2026-10-01', '2026-10-02', '2026-10-05']);
  });

  test('a day whose only tick was removed is no longer done', () => {
    expect(tickedDays(new Map([[1, new Set<string>()]])).has('2026-10-08')).toBe(false);
  });
});
