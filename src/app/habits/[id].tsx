import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** 1d · Modifier une habitude (modal). */
export default function EditHabitScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <View className="gap-3">
        <BackLink label={t('common.cancel')} fallback="/habits" />
        <Title>{t('habits.editTitle')}</Title>
      </View>
      <Placeholder>{t('placeholder.editHabit')}</Placeholder>
    </Screen>
  );
}
