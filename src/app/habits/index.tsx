import { Link } from 'expo-router';
import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';

/** 1b · Mes habitudes — reorder, edit, add. */
export default function HabitsScreen() {
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label="Terminé" fallback="/" align="right" strong />
        <Title>Mes habitudes</Title>
      </View>
      <Placeholder>Liste avec flèches haut/bas et crayon (étape 3)</Placeholder>
      <View className="gap-4">
        <Link href="/habits/1">
          <Text className="font-semibold">Modifier une habitude ›</Text>
        </Link>
        <Link href="/habits/new">
          <Text className="font-semibold">+ Nouvelle habitude</Text>
        </Link>
        <Link href="/habits/archived">
          <Text className="text-muted">Archivées ›</Text>
        </Link>
      </View>
    </Screen>
  );
}
