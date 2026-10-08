import { incomingFileUri } from '@/backup/incoming';

/**
 * Every address iOS opens the app with goes through here before Expo Router. A file shared to the
 * app (a Daygraph export, an AirDrop'd backup…) arrives as a file:// URL, which isn't a screen:
 * send it to the screen that reads it. Anything else passes through unchanged.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  const file = incomingFileUri(path);
  return file ? `/open-file?uri=${encodeURIComponent(file)}` : path;
}
