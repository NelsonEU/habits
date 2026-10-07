import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useSyncExternalStore } from 'react';

import { loadSnapshot } from './repo';

/*
 * Screens read a snapshot of the whole database and re-read it after every
 * write. SQLite's own change listener can't be used: it doesn't fire for
 * WITHOUT ROWID tables (checks, filled_days).
 */
let version = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Call after any write so screens reload. */
export function notifyChange() {
  version++;
  listeners.forEach((l) => l());
}

export function useSnapshot() {
  const db = useSQLiteContext();
  const current = useSyncExternalStore(subscribe, () => version);
  return useMemo(() => {
    void current; // reload whenever the version changes
    return loadSnapshot(db);
  }, [db, current]);
}
