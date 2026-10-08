import { calendarWeeks } from './calendar';

const TODAY = '2026-10-07'; // a Wednesday
const h = { start: '2026-09-29', checked: new Set(['2026-09-29', '2026-10-06']) };

describe('calendarWeeks', () => {
  const weeks = calendarWeeks(h, TODAY, 'monday', 2);

  test('columns are weeks starting on the chosen day, ending with the current week', () => {
    expect(weeks.map((w) => w[0].day)).toEqual(['2026-09-28', '2026-10-05']);
    expect(calendarWeeks(h, TODAY, 'sunday', 1)[0][0].day).toBe('2026-10-04');
  });

  test('cell states', () => {
    const state = (day: string) => weeks.flat().find((c) => c.day === day)!.state;
    expect(state('2026-09-28')).toBe('outside'); // before the habit started
    expect(state('2026-09-29')).toBe('done');
    expect(state('2026-09-30')).toBe('missed');
    expect(state('2026-10-07')).toBe('missed'); // today, nothing ticked yet
    expect(state('2026-10-08')).toBe('outside'); // future
  });

  test('marks today', () => {
    expect(weeks.flat().filter((c) => c.isToday).map((c) => c.day)).toEqual([TODAY]);
  });
});
