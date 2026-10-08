/**
 * When a JSON file is shared to the app ("Open in Habits" from Daygraph's export, AirDrop, Files…),
 * iOS copies it into the app's Documents/Inbox and opens the app with its file:// URL. Returns that
 * URL if `path` (what Expo Router receives) is such a file, otherwise null.
 */
export function incomingFileUri(path: string): string | null {
  return /^file:\/\//i.test(path) ? path : null;
}

/** The file's name, as shown on the import screen: "daygraph-backup-2026-10-07 16:53:23.json". */
export function fileNameOf(uri: string): string {
  const last = uri.split('/').pop() ?? uri;
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}
