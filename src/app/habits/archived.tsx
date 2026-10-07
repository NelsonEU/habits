import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** Archived habits: view their stats, restore them, or swipe to delete for good. */
export default function ArchivedHabitsScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('habits.title')} fallback="/habits" chevron />
        <Title>{t('habits.archivedTitle')}</Title>
      </View>
      <Placeholder>{t('placeholder.archived')}</Placeholder>
    </Screen>
  );
}
