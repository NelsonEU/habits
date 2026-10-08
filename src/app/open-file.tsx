import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, View } from 'react-native';

import { ImportError } from '@/backup/errors';
import { readSharedBackup } from '@/backup/files';
import { setPendingImport } from '@/backup/pending';
import { Screen } from '@/components/screen';
import { toDay } from '@/domain/day';
import { useTheme } from '@/theme';

/**
 * A file shared to the app lands here (see +native-intent.tsx): read it, then show the usual
 * import screen over the day screen, so cancelling goes back to the day.
 */
export default function OpenFileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { uri } = useLocalSearchParams<{ uri: string }>();

  useEffect(() => {
    if (!uri) {
      router.replace('/');
      return;
    }
    readSharedBackup(uri, toDay(new Date()))
      .then(({ backup, fileName }) => {
        setPendingImport({ backup, source: { kind: 'file', name: fileName } });
        router.replace('/');
        router.push('/import');
      })
      .catch((e) => {
        router.replace('/');
        if (!(e instanceof ImportError)) throw e;
        Alert.alert(t('import.failedTitle'), t(`import.errors.${e.code}`, e.params));
      });
  }, [uri, t]);

  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.muted} />
      </View>
    </Screen>
  );
}
