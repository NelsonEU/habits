/**
 * Why an import failed. The code is translated by the screen
 * (import.errors.<code> in the locale files), so this layer stays language-free.
 */
export type ImportErrorCode =
  | 'unreadable'
  | 'unknown-format'
  | 'invalid-daygraph'
  | 'negative-habit'
  | 'invalid-backup'
  | 'newer-version';

export class ImportError extends Error {
  constructor(
    readonly code: ImportErrorCode,
    /** Values for the message's placeholders: the habit's name for negative-habit. */
    readonly params: { name?: string } = {},
  ) {
    super(code);
  }
}
