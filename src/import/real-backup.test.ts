import fs from 'node:fs';
import path from 'node:path';

import { daysBetween } from '@/domain/day';
import { bestStreak, yearlyRates } from '@/domain/stats';
import { parseDaygraph } from './daygraph';

/**
 * Checks the importer and stats against the real Daygraph backup and the
 * figures in the brief. The backup is personal data, kept out of git in
 * private/: without it, this suite is skipped.
 */
const BACKUP = path.join(__dirname, '../../private/daygraph-backup.json');
const TODAY = '2026-10-07';

(fs.existsSync(BACKUP) ? describe : describe.skip)('real Daygraph backup', () => {
  const result = parseDaygraph(JSON.parse(fs.readFileSync(BACKUP, 'utf8')));
  const historyOf = (index: number) => {
    const { sourceId } = result.habits[index];
    return {
      start: result.firstDay!,
      checked: new Set(result.checks.filter((c) => c.sourceId === sourceId).map((c) => c.day)),
    };
  };

  test('1 390 ticks from 5 Jan 2024 to 6 Oct 2026, 2 of them duplicates', () => {
    const days = new Set(result.checks.map((c) => c.day));
    expect(result.checks.length + result.duplicates).toBe(1390);
    expect(result.duplicates).toBe(2);
    expect(result.firstDay).toBe('2024-01-05');
    expect([...days].sort().at(-1)).toBe('2026-10-06');
    expect(daysBetween('2024-01-05', '2026-10-06') + 1 - days.size).toBe(91); // days without any tick
  });

  test.each([
    [0, [51, 57, 73], 19, '2026-08-06'],
    [1, [73, 74, 73], 24, '2024-01-28'],
    [2, [5, 5, 5], 3, '2024-11-20'],
  ])('habit %d matches the brief', (index, years, record, recordEnd) => {
    const history = historyOf(index);
    expect(yearlyRates(history, TODAY).map((y) => Math.round(y.ratio! * 100))).toEqual(years);
    expect(bestStreak(history)).toMatchObject({ length: record, end: recordEnd });
  });
});
