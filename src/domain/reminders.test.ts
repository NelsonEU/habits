import type { Day } from './day';
import type { Habit, Reminder } from './model';
import { freeHour, fromTime, reminderMoments, toTime } from './reminders';

// Local times: the app schedules in the phone's timezone.
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes);
const NOW = at(8, 20, 30); // 8 Oct 2026, 20:30

const habit = (id: number, extra: Partial<Habit> = {}): Habit => ({
  id,
  uid: `h${id}`,
  name: `Habit ${id}`,
  color: '#6E9BF2',
  sortOrder: id,
  startDay: '2026-01-01',
  archivedAt: null,
  ...extra,
});
const general = (id: number, time: string): Reminder => ({ id, time, habitId: null });
const forHabit = (id: number, time: string, habitId: number): Reminder => ({ id, time, habitId });

function data(reminders: Reminder[], habits: Habit[] = [habit(1)], ticks: Record<number, Day[]> = {}) {
  return { reminders, habits, checks: new Map(habits.map((h) => [h.id, new Set(ticks[h.id] ?? [])])) };
}
const dates = (moments: { date: Date }[]) => moments.map((m) => m.date);

describe('reminderMoments', () => {
  test('one per day at the reminder time, starting today', () => {
    expect(dates(reminderMoments(data([general(1, '22:00')]), NOW, 3))).toEqual([at(8, 22), at(9, 22), at(10, 22)]);
  });

  test('skips times already past today', () => {
    expect(dates(reminderMoments(data([general(1, '18:00')]), NOW, 2))).toEqual([at(9, 18)]);
  });

  describe('general reminders', () => {
    const twice = [general(1, '22:00'), general(2, '21:00')];

    test('stay quiet on a day once every habit is ticked', () => {
      const moments = reminderMoments(data(twice, [habit(1), habit(2)], { 1: ['2026-10-08'], 2: ['2026-10-08'] }), NOW, 2);
      expect(dates(moments)).toEqual([at(9, 21), at(9, 22)]);
    });

    test('still remind while one habit is left', () => {
      const moments = reminderMoments(data(twice, [habit(1), habit(2)], { 1: ['2026-10-08'] }), NOW, 1);
      expect(dates(moments)).toEqual([at(8, 21), at(8, 22)]);
    });

    test('ignore archived habits and habits not started yet', () => {
      const habits = [habit(1), habit(2, { archivedAt: '2026-05-01T00:00:00.000Z' }), habit(3, { startDay: '2026-10-09' })];
      const moments = reminderMoments(data([general(1, '22:00')], habits, { 1: ['2026-10-08'] }), NOW, 2);
      expect(dates(moments)).toEqual([at(9, 22)]);
    });

    test('stay quiet without any habit', () => {
      expect(reminderMoments(data([general(1, '22:00')], []), NOW)).toEqual([]);
    });
  });

  describe('habit reminders', () => {
    test('name their habit, and stay quiet once it is ticked', () => {
      const moments = reminderMoments(
        data([forHabit(1, '21:00', 1), forHabit(2, '22:00', 2)], [habit(1), habit(2)], { 1: ['2026-10-08'] }),
        NOW,
        1,
      );
      expect(moments).toEqual([{ date: at(8, 22), habitId: 2 }]);
    });

    test('ignore the other habits', () => {
      const moments = reminderMoments(data([forHabit(1, '22:00', 1)], [habit(1), habit(2)], { 2: ['2026-10-08'] }), NOW, 1);
      expect(moments).toEqual([{ date: at(8, 22), habitId: 1 }]);
    });

    test('stay quiet while the habit is archived or not started', () => {
      const habits = [habit(1, { archivedAt: '2026-05-01T00:00:00.000Z' }), habit(2, { startDay: '2026-10-09' })];
      const moments = reminderMoments(data([forHabit(1, '22:00', 1), forHabit(2, '22:00', 2)], habits), NOW, 2);
      expect(moments).toEqual([{ date: at(9, 22), habitId: 2 }]);
    });
  });

  test('stays under the iOS limit, keeping the earliest', () => {
    const five = ['08:00', '12:00', '18:00', '21:00', '22:00'].map((time, id) => general(id, time));
    const moments = reminderMoments(data(five), at(8, 0), 14);
    expect(moments).toHaveLength(60);
    expect(moments[0].date).toEqual(at(8, 8));
  });

  test('nothing without reminders', () => {
    expect(reminderMoments(data([]), NOW)).toEqual([]);
  });
});

test('freeHour picks the first whole hour not taken', () => {
  expect(freeHour([], 9)).toBe('09:00');
  expect(freeHour(['09:00', '10:00'], 9)).toBe('11:00');
  expect(freeHour(['21:00', '22:00', '23:00'], 21)).toBe('00:00');
});

test('toTime and fromTime round-trip', () => {
  expect(toTime(fromTime('07:05'))).toBe('07:05');
  expect(toTime(at(8, 22, 30))).toBe('22:30');
});
