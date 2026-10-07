import { Link } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';

/** 2 · Statistiques — one card per habit. */
export default function StatsScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.today')} fallback="/" chevron />
        <Title>{t('stats.title')}</Title>
      </View>
      <Placeholder>{t('placeholder.stats')}</Placeholder>
      <Link href="/stats/1">
        <Text className="font-semibold">{t('stats.detailLink')}</Text>
      </Link>
    </Screen>
  );
}
