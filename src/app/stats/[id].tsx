import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';

/** 3 · Détail d’une habitude. */
export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Screen scroll>
      <View style={{ gap: 12 }}>
        <BackLink label="Statistiques" fallback="/stats" chevron />
        <Title style={{ fontSize: 36 }}>Habitude {id}</Title>
      </View>
      <Placeholder>Où j’en suis · Est-ce que je progresse ? · Quels jours coincent ? · Jour par jour (étape 5)</Placeholder>
    </Screen>
  );
}
