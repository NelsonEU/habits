import { DEFAULT_SETTINGS, type Habit, type Snapshot } from '@/domain/model';
import type { Backup, BackupHabit } from './backup';
import { planMerge } from './merge';

const local = (id: number, uid: string, name: string, startDay = '2026-01-01'): Habit => ({
  id,
  uid,
  name,
  color: '#F0B35A',
  sortOrder: id,
  startDay,
  archivedAt: null,
});

const incoming = (uid: string | null, name: string, checks: string[], startDay = '2026-01-01'): BackupHabit => ({
  uid,
  name,
  color: '#6E9BF2',
  startDay,
  archivedAt: null,
  checks,
});

const snapshot: Snapshot = {
  habits: [local(1, 'a', 'Ne pas boire'), local(2, 'b', 'Lire')],
  checks: new Map([
    [1, new Set(['2026-10-01', '2026-10-02'])],
    [2, new Set<string>()],
  ]),
  tickedDays: new Set(['2026-10-01', '2026-10-02']),
  settings: DEFAULT_SETTINGS,
  reminders: [],
};

const backup = (habits: BackupHabit[]): Backup => ({ habits });

describe('planMerge', () => {
  test('matches by permanent id even after a rename, and only adds missing ticks', () => {
    const plan = planMerge(snapshot, backup([incoming('a', 'Pas d’alcool', ['2026-10-02', '2026-10-03'])]));
    expect(plan.updates).toEqual([{ habitId: 1, addChecks: ['2026-10-03'], startDay: null }]);
    expect(plan.inserts).toEqual([]);
  });

  test('matches by name, ignoring case and spaces, when the source has no ids', () => {
    const plan = planMerge(snapshot, backup([incoming(null, '  ne pas   BOIRE ', ['2026-10-03'])]));
    expect(plan.updates).toEqual([{ habitId: 1, addChecks: ['2026-10-03'], startDay: null }]);
  });

  test('adds unknown habits', () => {
    const habit = incoming('z', 'Méditer', ['2026-10-01']);
    expect(planMerge(snapshot, backup([habit])).inserts).toEqual([habit]);
  });

  test('moves the start day earlier, never later', () => {
    expect(planMerge(snapshot, backup([incoming('b', 'Lire', [], '2025-06-01')])).updates).toEqual([
      { habitId: 2, addChecks: [], startDay: '2025-06-01' },
    ]);
    expect(planMerge(snapshot, backup([incoming('b', 'Lire', [], '2026-06-01')])).updates).toEqual([]);
  });

  test('matches each app habit at most once', () => {
    const plan = planMerge(snapshot, backup([incoming(null, 'Lire', []), incoming(null, 'lire', ['2026-10-05'])]));
    expect(plan.inserts.map((h) => h.name)).toEqual(['lire']);
  });
});
