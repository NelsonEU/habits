import { filledDays } from './model';

describe('filledDays', () => {
  test('a day with a tick, or marked "nothing kept", is filled in', () => {
    const checks = new Map([
      [1, new Set(['2026-10-01', '2026-10-02'])],
      [2, new Set(['2026-10-02'])],
    ]);
    expect([...filledDays(['2026-10-05'], checks)].sort()).toEqual(['2026-10-01', '2026-10-02', '2026-10-05']);
  });

  test('unticking the only tick of a day leaves it unfilled', () => {
    const checks = new Map([[1, new Set<string>()]]);
    expect(filledDays([], checks).has('2026-10-08')).toBe(false);
  });
});
