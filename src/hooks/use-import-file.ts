import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { ImportError } from '@/backup/errors';
import { pickBackup } from '@/backup/files';
import { setPendingImport } from '@/backup/pending';
import type { Day } from '@/domain/day';

/**
 * Picks a backup file and opens the import screen, which shows what it contains before anything
 * changes. `importing` is true while the file is read.
 */
export function useImportFile(today: Day) {
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);

  const importFile = async () => {
    setImporting(true);
    try {
      const picked = await pickBackup(today);
      if (picked) {
        setPendingImport({ backup: picked.backup, source: { kind: 'file', name: picked.fileName } });
        router.push('/import');
      }
    } catch (e) {
      if (!(e instanceof ImportError)) throw e;
      Alert.alert(t('import.failedTitle'), t(`import.errors.${e.code}`, e.params));
    } finally {
      setImporting(false);
    }
  };

  return { importing, importFile };
}
