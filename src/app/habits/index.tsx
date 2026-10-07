import { Link } from 'expo-router';
import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Body, Title } from '@/components/text';

/** 1b · Mes habitudes — reorder, edit, add. */
export default function HabitsScreen() {
  return (
    <Screen scroll>
      <View style={{ gap: 12 }}>
        <BackLink label="Terminé" fallback="/" align="right" strong />
        <Title>Mes habitudes</Title>
      </View>
      <Placeholder>Liste avec flèches haut/bas et crayon (étape 3)</Placeholder>
      <View style={{ gap: 16 }}>
        <Link href="/habits/1">
          <Body weight="semibold">Modifier une habitude ›</Body>
        </Link>
        <Link href="/habits/new">
          <Body weight="semibold">+ Nouvelle habitude</Body>
        </Link>
        <Link href="/habits/archived">
          <Body tone="muted">Archivées ›</Body>
        </Link>
      </View>
    </Screen>
  );
}
