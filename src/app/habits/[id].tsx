import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** 1d · Modifier une habitude (modal). */
export default function EditHabitScreen() {
  return (
    <Screen>
      <View className="gap-3">
        <BackLink label="Annuler" fallback="/habits" />
        <Title>Modifier</Title>
      </View>
      <Placeholder>Nom · Couleur · Archiver (étape 3)</Placeholder>
    </Screen>
  );
}
