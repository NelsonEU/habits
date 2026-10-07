import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { importDaygraph } from '@/db/repo';
import { notifyChange } from '@/db/store';
import type { Day } from '@/domain/day';
import { ImportError, parseDaygraph } from './daygraph';

/**
 * Lets the user pick a Daygraph backup in Files, then imports it.
 * Returns null if the picker was cancelled. Throws ImportError with a
 * message meant for the user.
 */
export async function pickAndImportDaygraph(db: SQLiteDatabase, today: Day) {
  // Any type: Daygraph backups are plain .json files, but some share sheets save them without a proper type.
  const picked = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (picked.canceled) return null;

  let json: unknown;
  try {
    json = JSON.parse(await new File(picked.assets[0].uri).text());
  } catch {
    throw new ImportError('Ce fichier n’est pas lisible : choisis la sauvegarde .json de Daygraph.');
  }
  const data = parseDaygraph(json);
  importDaygraph(db, data, today);
  notifyChange();
  return { habits: data.habits.length, checks: data.checks.length };
}
