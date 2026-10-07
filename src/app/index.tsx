import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Fab, IconButton } from '@/components/buttons';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { Body, Title } from '@/components/text';

/** 1 · Le jour — opens on today. */
export default function DayScreen() {
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <Screen overlay={<Fab icon="pencil" label="Modifier mes habitudes" onPress={() => router.push('/habits')} />}>
      <View style={styles.topBar}>
        <View style={styles.week}>
          <Placeholder>Bandeau de la semaine (étape 2)</Placeholder>
        </View>
        <IconButton icon="chart.bar" label="Statistiques" onPress={() => router.push('/stats')} />
        <IconButton icon="slider.horizontal.3" label="Réglages" onPress={() => router.push('/settings')} />
      </View>

      <View style={styles.heading}>
        <Title style={styles.dayTitle}>Aujourd’hui</Title>
        <Body tone="muted" size={14}>
          {today.charAt(0).toUpperCase() + today.slice(1)}
        </Body>
      </View>

      <Placeholder>Cases à cocher des habitudes (étape 2)</Placeholder>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  week: { flex: 1 },
  heading: { gap: 6 },
  dayTitle: { fontSize: 36 },
});
