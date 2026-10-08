import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { ImportError } from '@/backup/errors';
import { exportAndShare, pickBackup, readSafetyCopy, safetyCopyDate, saveSafetyCopy } from '@/backup/files';
import { setPendingImport } from '@/backup/pending';
import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { SettingsRow, SettingsSection } from '@/components/settings-list';
import { Text, Title } from '@/components/text';
import { replaceAll } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import { useToday } from '@/hooks/use-today';
import { locale } from '@/i18n';

/** 4 · Réglages. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const snapshot = useSnapshot();
  const today = useToday();

  // Re-read whenever the screen shows again: coming back from a "replace" creates a new copy.
  const [copyDate, setCopyDate] = useState<Date | null>(null);
  useFocusEffect(useCallback(() => setCopyDate(safetyCopyDate()), []));

  const showImportError = (e: unknown) => {
    if (!(e instanceof ImportError)) throw e;
    Alert.alert(t('import.failedTitle'), t(`import.errors.${e.code}`, e.params));
  };

  const importFile = async () => {
    try {
      const picked = await pickBackup(today);
      if (!picked) return;
      setPendingImport({ backup: picked.backup, source: { kind: 'file', name: picked.fileName } });
      router.push('/import');
    } catch (e) {
      showImportError(e);
    }
  };

  const restoreCopy = async () => {
    try {
      setPendingImport({ backup: await readSafetyCopy(today), source: { kind: 'safety-copy', date: copyDate } });
      router.push('/import');
    } catch (e) {
      showImportError(e);
    }
  };

  // TEMPORARY, development builds only: wipes everything, after saving the safety copy.
  const confirmClearAll = () =>
    Alert.alert(t('settings.clearAllConfirmTitle'), t('settings.clearAllConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.clearAllConfirm'),
        style: 'destructive',
        onPress: () => {
          saveSafetyCopy(snapshot);
          replaceAll(db, { habits: [], filledDays: [] });
          notifyChange();
          setCopyDate(safetyCopyDate());
        },
      },
    ]);

  const exportData = async () => {
    try {
      await exportAndShare(snapshot, today);
    } catch (e) {
      Alert.alert(t('settings.exportFailed'), e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.back')} fallback="/" chevron />
        <Title>{t('settings.title')}</Title>
      </View>

      <Placeholder>{t('placeholder.settings')}</Placeholder>

      <SettingsSection title={t('settings.backupSection')} footer={t('settings.backupHint')}>
        <SettingsRow icon="square.and.arrow.up" label={t('settings.export')} onPress={exportData} />
        <SettingsRow icon="square.and.arrow.down" label={t('settings.import')} onPress={importFile} />
        {copyDate && (
          <SettingsRow
            icon="arrow.uturn.backward"
            label={t('settings.restoreCopy')}
            detail={t('settings.restoreCopyHint', {
              date: copyDate.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }),
            })}
            onPress={restoreCopy}
          />
        )}
      </SettingsSection>

      {__DEV__ && (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={confirmClearAll}
            className="min-h-14 items-center justify-center rounded-full bg-danger px-5 active:opacity-70"
          >
            <Text className="text-[17px] font-semibold text-on-accent">{t('settings.clearAll')}</Text>
          </Pressable>
          <Text className="mx-1 text-[13px] leading-[19px] text-muted">{t('settings.clearAllHint')}</Text>
        </View>
      )}
    </Screen>
  );
}
