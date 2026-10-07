import { Link } from 'expo-router';
import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';

/** 2 · Statistiques — one card per habit. */
export default function StatsScreen() {
  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label="Aujourd’hui" fallback="/" chevron />
        <Title>Statistiques</Title>
      </View>
      <Placeholder>Une carte par habitude (étape 5)</Placeholder>
      <Link href="/stats/1">
        <Text className="font-semibold">Voir le détail d’une habitude ›</Text>
      </Link>
    </Screen>
  );
}
