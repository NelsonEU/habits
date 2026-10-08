import { type SQLiteDatabase, useSQLiteContext } from 'expo-sqlite';
import { useSyncExternalStore } from 'react';

import type { Snapshot } from '@/domain/model';
import { loadSnapshot } from './repo';

/*
 * Screens read a snapshot of the whole database, reloaded after every write.
 * The store owns the snapshot itself, so React sees a new object after each
 * change. (Deriving it with useMemo and a version dependency doesn't work:
 * the React Compiler drops a dependency the memo body doesn't really use.)
 * SQLite's own change listener can't be used: it doesn't fire for
 * WITHOUT ROWID tables (checks).
 */
let version = 0;
let cached: { version: number; snapshot: Snapshot } | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function read(db: SQLiteDatabase): Snapshot {
  if (cached?.version !== version) cached = { version, snapshot: loadSnapshot(db) };
  return cached.snapshot;
}

/** Call after any write so screens reload. */
export function notifyChange() {
  version++;
  listeners.forEach((l) => l());
}

export function useSnapshot(): Snapshot {
  const db = useSQLiteContext();
  return useSyncExternalStore(subscribe, () => read(db));
}
