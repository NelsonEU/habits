import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { importDaygraph } from '@/db/repo';
import { notifyChange } from '@/db/store';
import type { Day } from '@/domain/day';
import { ImportError, isDaygraphBackup, parseDaygraph } from './daygraph';

/**
 * Lets the user pick a backup file in Files, recognizes its format and imports
 * it. Returns null if the picker was cancelled. Throws ImportError with a
 * message meant for the user.
 */
export async function pickAndImport(db: SQLiteDatabase, today: Day) {
  // Any type: backups are plain .json files, but some share sheets save them without a proper type.
  const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (picked.canceled) return null;

  let json: unknown;
  try {
    json = JSON.parse(await new File(picked.assets[0].uri).text());
  } catch {
    throw new ImportError('Ce fichier n’est pas lisible.');
  }

  // Only Daygraph backups for now; the app's own export format comes with the export feature.
  if (!isDaygraphBackup(json)) throw new ImportError('Ce fichier n’est pas une sauvegarde reconnue.');
  const data = parseDaygraph(json);
  importDaygraph(db, data, today);
  notifyChange();
  return { habits: data.habits.length, checks: data.checks.length };
}
