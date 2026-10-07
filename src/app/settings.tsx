import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** 4 · Réglages. */
export default function SettingsScreen() {
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label="Retour" fallback="/" chevron />
        <Title>Réglages</Title>
      </View>
      <Placeholder>Affichage · Rappels · Sauvegarde · Commentaire (étapes 4 et 6)</Placeholder>
    </Screen>
  );
}
