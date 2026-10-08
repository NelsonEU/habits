import { fromTime, reminderMoments, toTime } from './reminders';

// Local times: the app schedules in the phone's timezone.
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes);
const NOW = at(8, 20, 30); // 8 Oct 2026, 20:30
const evening = [{ id: 1, time: '22:00' }];

describe('reminderMoments', () => {
  test('one per day at the reminder time, starting today', () => {
    expect(reminderMoments(evening, new Set(), NOW, 3)).toEqual([at(8, 22), at(9, 22), at(10, 22)]);
  });

  test('skips times already past today', () => {
    expect(reminderMoments([{ id: 1, time: '18:00' }], new Set(), NOW, 2)).toEqual([at(9, 18)]);
  });

  test('skips every reminder of a day already filled in', () => {
    const twice = [...evening, { id: 2, time: '21:00' }];
    expect(reminderMoments(twice, new Set(['2026-10-08']), NOW, 2)).toEqual([at(9, 21), at(9, 22)]);
  });

  test('stays under the iOS limit, keeping the earliest', () => {
    const five = ['08:00', '12:00', '18:00', '21:00', '22:00'].map((time, id) => ({ id, time }));
    const moments = reminderMoments(five, new Set(), at(8, 0), 14);
    expect(moments).toHaveLength(60);
    expect(moments[0]).toEqual(at(8, 8));
  });

  test('nothing without reminders', () => {
    expect(reminderMoments([], new Set(), NOW)).toEqual([]);
  });
});

test('toTime and fromTime round-trip', () => {
  expect(toTime(fromTime('07:05'))).toBe('07:05');
  expect(toTime(at(8, 22, 30))).toBe('22:30');
});
