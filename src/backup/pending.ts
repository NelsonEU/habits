import type { Backup } from './backup';

/*
 * The backup waiting on the import screen. A file's content is too big for a
 * route parameter, so the screen that reads the file leaves it here and the
 * import screen picks it up. Lost if the app restarts, which simply cancels the import.
 */
export type PendingImport = {
  backup: Backup;
  /** Where it comes from: a picked file's name, or the safety copy and its date. */
  source: { kind: 'file'; name: string } | { kind: 'safety-copy'; date: Date | null };
};

let pending: PendingImport | null = null;

export function setPendingImport(value: PendingImport | null) {
  pending = value;
}

export function getPendingImport() {
  return pending;
}
