import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** Archived habits: view their stats, restore them, or swipe to delete for good. */
export default function ArchivedHabitsScreen() {
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label="Mes habitudes" fallback="/habits" chevron />
        <Title>Archivées</Title>
      </View>
      <Placeholder>Habitudes archivées : restaurer, glisser pour supprimer (étape 3)</Placeholder>
    </Screen>
  );
}
