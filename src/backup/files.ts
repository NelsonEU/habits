import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { Share } from 'react-native';

import type { Day } from '@/domain/day';
import type { Snapshot } from '@/domain/model';
import { type Backup, daygraphToBackup, isBackupFile, parseBackupFile, toBackupFile } from './backup';
import { isDaygraphBackup, parseDaygraph } from './daygraph';
import { ImportError } from './errors';
import { fileNameOf } from './incoming';

/** Reads a backup in any supported format: this app's export, or Daygraph's. */
function readBackup(text: string, today: Day): Backup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ImportError('unreadable');
  }
  if (isBackupFile(json)) return parseBackupFile(json);
  if (isDaygraphBackup(json)) return daygraphToBackup(parseDaygraph(json), today);
  throw new ImportError('unknown-format');
}

/**
 * Lets the user pick a file in Files and reads it, without changing any data.
 * Returns null if the picker was cancelled. Throws ImportError.
 */
export async function pickBackup(today: Day): Promise<{ backup: Backup; fileName: string } | null> {
  // Any type: backups are plain .json files, but some share sheets save them without a proper type.
  const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (picked.canceled) return null;
  const asset = picked.assets[0];
  return { backup: readBackup(await readText(asset.uri), today), fileName: asset.name };
}

async function readText(uri: string): Promise<string> {
  try {
    return await new File(uri).text();
  } catch {
    throw new ImportError('unreadable');
  }
}

/**
 * Reads a file shared to the app (see incoming.ts), then deletes iOS's copy of it in the app's
 * Inbox: the data now waits on the import screen. Throws ImportError.
 */
export async function readSharedBackup(uri: string, today: Day): Promise<{ backup: Backup; fileName: string }> {
  try {
    return { backup: readBackup(await readText(uri), today), fileName: fileNameOf(uri) };
  } finally {
    try {
      new File(uri).delete();
    } catch {
      // Already gone, or outside the app's folders: nothing to clean up.
    }
  }
}

/** Writes an export file and opens the share sheet (Files, iCloud Drive, AirDrop…). */
export async function exportAndShare(snapshot: Snapshot, today: Day) {
  const file = new File(Paths.cache, `habits-${today}.json`);
  file.create({ overwrite: true });
  file.write(toBackupFile(snapshot, new Date()));
  await Share.share({ url: file.uri });
}

/*
 * The safety copy: the app's data as it was just before the last "replace",
 * kept in the app's own storage so a wrong file can be undone.
 */
const safetyCopy = () => new File(Paths.document, 'before-last-replace.json');

export function saveSafetyCopy(snapshot: Snapshot) {
  const file = safetyCopy();
  file.create({ overwrite: true });
  file.write(toBackupFile(snapshot, new Date()));
}

/** When the safety copy was made, or null if there is none. */
export function safetyCopyDate(): Date | null {
  const file = safetyCopy();
  if (!file.exists) return null;
  try {
    const { exportedAt } = JSON.parse(file.textSync()) as { exportedAt?: string };
    return exportedAt ? new Date(exportedAt) : null;
  } catch {
    return null;
  }
}

export async function readSafetyCopy(today: Day): Promise<Backup> {
  return readBackup(await safetyCopy().text(), today);
}
