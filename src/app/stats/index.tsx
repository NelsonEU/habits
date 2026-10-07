import { Link } from 'expo-router';
import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Body, Title } from '@/components/text';

/** 2 · Statistiques — one card per habit. */
export default function StatsScreen() {
  return (
    <Screen scroll>
      <View style={{ gap: 12 }}>
        <BackLink label="Aujourd’hui" fallback="/" chevron />
        <Title>Statistiques</Title>
      </View>
      <Placeholder>Une carte par habitude (étape 5)</Placeholder>
      <Link href="/stats/1">
        <Body weight="semibold">Voir le détail d’une habitude ›</Body>
      </Link>
    </Screen>
  );
}
