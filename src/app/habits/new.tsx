import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** 1c · Nouvelle habitude (modal). */
export default function NewHabitScreen() {
  return (
    <Screen>
      <View className="gap-3">
        <BackLink label="Annuler" fallback="/habits" />
        <Title>Nouvelle habitude</Title>
      </View>
      <Placeholder>Nom · Couleur · Aperçu (étape 3)</Placeholder>
    </Screen>
  );
}
