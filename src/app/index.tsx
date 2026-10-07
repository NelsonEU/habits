import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Fab, IconButton } from '@/components/buttons';
import { HabitCard } from '@/components/habit-card';
import { Screen } from '@/components/screen';
import { Body, Title } from '@/components/text';
import { WeekDays, WeekNav } from '@/components/week-strip';
import { markFilled, setChecked } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import { addDays, type Day, startOfWeek } from '@/domain/day';
import { dayDots, weekBounds } from '@/domain/day-view';
import { dayTitle, longDay, streakLabel } from '@/domain/format';
import { habitsOn, historyOf } from '@/domain/model';
import { currentStreak } from '@/domain/stats';
import { useToday } from '@/hooks/use-today';
import { pickAndImportDaygraph } from '@/import/pick';
import { useTheme } from '@/theme';

// Becomes a setting in step 6.
const WEEK_STARTS_ON = 'monday';

/** 1 · Le jour — opens on today. */
export default function DayScreen() {
  const db = useSQLiteContext();
  const snapshot = useSnapshot();
  const today = useToday();

  // null = follow today, so the screen rolls over at midnight on its own.
  const [pickedDay, setPickedDay] = useState<Day | null>(null);
  const [pickedWeek, setPickedWeek] = useState<Day | null>(null);
  const selected = pickedDay ?? today;
  const weekStart = pickedWeek ?? startOfWeek(selected, WEEK_STARTS_ON);
  const bounds = weekBounds(snapshot, today, WEEK_STARTS_ON);

  const habits = habitsOn(snapshot, selected);
  const anyDone = habits.some((h) => snapshot.checks.get(h.id)?.has(selected));
  const filled = snapshot.filled.has(selected);

  const toggle = (habitId: number, checked: boolean) => {
    setChecked(db, habitId, selected, !checked);
    notifyChange();
    if (checked) Haptics.selectionAsync();
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToday = () => {
    setPickedDay(null);
    setPickedWeek(null);
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.topBar}>
        <WeekNav
          weekStart={weekStart}
          onPrev={weekStart > bounds.first ? () => setPickedWeek(addDays(weekStart, -7)) : null}
          onNext={weekStart < bounds.last ? () => setPickedWeek(addDays(weekStart, 7)) : null}
        />
        <IconButton icon="chart.bar" label="Statistiques" onPress={() => router.push('/stats')} />
        <IconButton icon="slider.horizontal.3" label="Réglages" onPress={() => router.push('/settings')} />
      </View>
      <WeekDays
        weekStart={weekStart}
        today={today}
        selected={selected}
        dotsFor={(day) => dayDots(snapshot, day, today)}
        onSelect={(day) => setPickedDay(day === today ? null : day)}
      />
    </View>
  );

  if (snapshot.habits.length === 0) return <Welcome today={today} />;

  return (
    <Screen scroll overlay={<Fab icon="pencil" label="Modifier mes habitudes" onPress={() => router.push('/habits')} />}>
      {header}

      <View style={styles.titleRow}>
        <View style={styles.titleText}>
          <Title style={styles.dayTitle}>{dayTitle(selected, today)}</Title>
          <Body tone="muted" size={14}>
            {selected >= addDays(today, -1)
              ? longDay(selected)
              : filled
                ? 'Jour passé · tu peux encore le modifier'
                : 'Jour non rempli · tu peux le compléter'}
          </Body>
        </View>
        {selected !== today && <PillButton label="Aujourd’hui" onPress={goToday} />}
      </View>

      <View style={styles.list}>
        {habits.map((h) => {
          const checked = snapshot.checks.get(h.id)?.has(selected) ?? false;
          return (
            <HabitCard
              key={h.id}
              name={h.name}
              color={h.color}
              checked={checked}
              subtitle={streakLabel(currentStreak(historyOf(snapshot, h), selected))}
              onToggle={() => toggle(h.id, checked)}
            />
          );
        })}
        {habits.length === 0 && (
          <Body tone="muted">Aucune habitude active ce jour-là. Le crayon en bas permet d’en ajouter.</Body>
        )}
      </View>

      <View style={styles.footer}>
        {anyDone || filled ? (
          <Body tone="muted" size={14}>
            {selected === today ? 'C’est enregistré. Tu peux fermer l’app.' : 'C’est enregistré.'}
          </Body>
        ) : (
          <>
            <Body tone="muted" size={14}>
              Touche ce que tu as tenu.
            </Body>
            {habits.length > 0 && (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  markFilled(db, selected);
                  notifyChange();
                }}
              >
                <Body size={14} weight="semibold" style={styles.link}>
                  Rien de tenu ce jour-là
                </Body>
              </Pressable>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

/** First launch: nothing in the database yet. */
function Welcome({ today }: { today: Day }) {
  const db = useSQLiteContext();
  const [importing, setImporting] = useState(false);

  const importBackup = async () => {
    setImporting(true);
    try {
      const result = await pickAndImportDaygraph(db, today);
      if (result) {
        Alert.alert('Import terminé', `${result.habits} habitudes et ${result.checks.toLocaleString('fr-FR')} jours cochés.`);
      }
    } catch (e) {
      Alert.alert('Import impossible', e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Screen>
      <View style={styles.welcome}>
        <Title>Bienvenue</Title>
        <Body tone="muted">
          Chaque soir, coche les habitudes que tu as tenues. Commence par récupérer ton historique Daygraph, ou crée ta
          première habitude.
        </Body>
      </View>
      <View style={styles.welcomeActions}>
        <PrimaryButton
          label={importing ? 'Import en cours…' : 'Importer une sauvegarde Daygraph'}
          onPress={importing ? undefined : importBackup}
        />
        <PillButton label="Créer une habitude" onPress={() => router.push('/habits/new')} />
      </View>
    </Screen>
  );
}

function PillButton({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pill, { borderColor: theme.colors.lineStrong, opacity: pressed ? 0.6 : 1 }]}
    >
      <Body size={14}>{label}</Body>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress?: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, { backgroundColor: theme.colors.text, opacity: !onPress || pressed ? 0.7 : 1 }]}
    >
      <Body size={17} weight="semibold" style={{ color: theme.colors.onAccent }}>
        {label}
      </Body>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: 14 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  titleText: { flex: 1, gap: 6 },
  dayTitle: { fontSize: 36, lineHeight: 38 },
  list: { gap: 12 },
  footer: { marginTop: 'auto', minHeight: 60, paddingRight: 84, justifyContent: 'center', gap: 6 },
  link: { textDecorationLine: 'underline' },
  pill: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  welcome: { gap: 12, marginTop: 40 },
  welcomeActions: { gap: 12, marginTop: 'auto' },
  primary: { minHeight: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});
