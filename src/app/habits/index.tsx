import { Link } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';

/** 1b · Mes habitudes — reorder, edit, add. */
export default function HabitsScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.done')} fallback="/" align="right" strong />
        <Title>{t('habits.title')}</Title>
      </View>
      <Placeholder>{t('placeholder.habits')}</Placeholder>
      <View className="gap-4">
        <Link href="/habits/1">
          <Text className="font-semibold">{t('habits.editLink')}</Text>
        </Link>
        <Link href="/habits/new">
          <Text className="font-semibold">{t('habits.new')}</Text>
        </Link>
        <Link href="/habits/archived">
          <Text className="text-muted">{t('habits.archivedLink')}</Text>
        </Link>
      </View>
    </Screen>
  );
}
