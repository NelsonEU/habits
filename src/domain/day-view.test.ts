import { dayDots, weekBounds } from './day-view';
import { DEFAULT_SETTINGS, type Habit, type Snapshot } from './model';

const habit = (id: number, startDay: string, archivedAt: string | null = null): Habit => ({
  id,
  uid: `uid-${id}`,
  name: `Habitude ${id}`,
  color: `#00000${id}`,
  sortOrder: id,
  startDay,
  archivedAt,
});

const snapshot: Snapshot = {
  habits: [habit(1, '2026-09-01'), habit(2, '2026-10-06'), habit(3, '2026-09-01', '2026-10-01T10:00:00Z')],
  checks: new Map([
    [1, new Set(['2026-10-05', '2026-10-07'])],
    [2, new Set()],
    [3, new Set()],
  ]),
  tickedDays: new Set(['2026-10-05', '2026-10-07']),
  settings: DEFAULT_SETTINGS,
  reminders: [],
};
const TODAY = '2026-10-07';

describe('dayDots', () => {
  test('ticked or not', () => {
    expect(dayDots(snapshot, '2026-10-05', TODAY)).toEqual([{ color: '#000001', state: 'done' }]);
    expect(dayDots(snapshot, '2026-10-04', TODAY)).toEqual([{ color: '#000001', state: 'missed' }]);
  });

  test('only habits started by then, archived ones hidden', () => {
    expect(dayDots(snapshot, '2026-10-06', TODAY).map((d) => d.color)).toEqual(['#000001', '#000002']);
  });

  test('today shows like any day, the future has no dots', () => {
    expect(dayDots(snapshot, TODAY, TODAY).map((d) => d.state)).toEqual(['done', 'missed']);
    expect(dayDots(snapshot, '2026-10-08', TODAY)).toEqual([]);
  });
});

test('weekBounds spans from the earliest habit to the current week', () => {
  expect(weekBounds(snapshot, TODAY, 'monday')).toEqual({ first: '2026-08-31', last: '2026-10-05' });
  expect(weekBounds({ ...snapshot, habits: [] }, TODAY, 'monday')).toEqual({
    first: '2026-10-05',
    last: '2026-10-05',
  });
});
