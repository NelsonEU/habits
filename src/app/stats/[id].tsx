import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** 3 · Détail d’une habitude. */
export default function HabitDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('stats.title')} fallback="/stats" chevron />
        <Title className="text-4xl">{t('stats.detailTitle', { id })}</Title>
      </View>
      <Placeholder>{t('placeholder.detail')}</Placeholder>
    </Screen>
  );
}
