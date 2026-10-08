import type { Day } from '@/domain/day';
import type { Snapshot } from '@/domain/model';
import type { Backup, BackupHabit } from './backup';

/** What merging a backup into the app changes. Merging only ever adds. */
export type MergePlan = {
  /** Habits already in the app: ticks to add, and an earlier start day if the backup has one. */
  updates: { habitId: number; addChecks: Day[]; startDay: Day | null }[];
  /** Habits only in the backup, added at the end of the list. */
  inserts: BackupHabit[];
};

/** "  Ne  pas BOIRE " and "ne pas boire" are the same habit. */
const normalize = (name: string) => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

/**
 * Matches each backup habit to an app habit: by permanent id first (survives
 * renames), then by name for sources without ids (Daygraph). Matched habits
 * keep the app's name, color, order and archive status.
 */
export function planMerge(snapshot: Snapshot, backup: Backup): MergePlan {
  const matched = new Set<number>();
  const plan: MergePlan = { updates: [], inserts: [] };

  for (const incoming of backup.habits) {
    const local =
      (incoming.uid !== null && snapshot.habits.find((h) => h.uid === incoming.uid && !matched.has(h.id))) ||
      snapshot.habits.find((h) => !matched.has(h.id) && normalize(h.name) === normalize(incoming.name));

    if (!local) {
      // Its id may already be taken (the same habit twice in a file): it then gets a new one.
      const taken = incoming.uid !== null && snapshot.habits.some((h) => h.uid === incoming.uid);
      plan.inserts.push(taken ? { ...incoming, uid: null } : incoming);
      continue;
    }
    matched.add(local.id);
    const existing = snapshot.checks.get(local.id) ?? new Set<Day>();
    const addChecks = incoming.checks.filter((d) => !existing.has(d));
    const startDay = incoming.startDay < local.startDay ? incoming.startDay : null;
    if (addChecks.length > 0 || startDay) plan.updates.push({ habitId: local.id, addChecks, startDay });
  }

  return plan;
}
