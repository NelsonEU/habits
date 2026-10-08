/**
 * When a JSON file is shared to the app ("Open in Habits" from Daygraph's export, AirDrop, Files…),
 * iOS copies it into the app's Documents/Inbox and opens the app with its file:// URL; Android
 * passes a content:// URL to the original file. Returns that URL if `path` (what Expo Router
 * receives) is such a file, otherwise null.
 */
export function incomingFileUri(path: string): string | null {
  return /^(file|content):\/\//i.test(path) ? path : null;
}

/** Only iOS's own copy in the app's Inbox may be deleted after reading, never the user's file. */
export function isInboxCopy(uri: string): boolean {
  return /^file:\/\//i.test(uri) && uri.includes('/Inbox/');
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
