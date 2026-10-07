import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** 4 · Réglages. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.back')} fallback="/" chevron />
        <Title>{t('settings.title')}</Title>
      </View>
      <Placeholder>{t('placeholder.settings')}</Placeholder>
    </Screen>
  );
}
