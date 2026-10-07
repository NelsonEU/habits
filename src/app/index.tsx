import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { Fab, IconButton, PillButton, PrimaryButton } from '@/components/buttons';
import { HabitCard } from '@/components/habit-card';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';
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

  if (snapshot.habits.length === 0) return <Welcome today={today} />;

  return (
    <Screen scroll overlay={<Fab icon="pencil" label="Modifier mes habitudes" onPress={() => router.push('/habits')} />}>
      <View className="gap-3.5">
        <View className="flex-row items-center gap-2">
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

      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1 gap-1.5">
          <Title className="text-4xl leading-[38px]">{dayTitle(selected, today)}</Title>
          <Text className="text-sm text-muted">
            {selected >= addDays(today, -1)
              ? longDay(selected)
              : filled
                ? 'Jour passé · tu peux encore le modifier'
                : 'Jour non rempli · tu peux le compléter'}
          </Text>
        </View>
        {selected !== today && <PillButton label="Aujourd’hui" onPress={goToday} />}
      </View>

      <View className="gap-3">
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
          <Text className="text-muted">Aucune habitude active ce jour-là. Le crayon en bas permet d’en ajouter.</Text>
        )}
      </View>

      <View className="mt-auto min-h-[60px] justify-center gap-1.5 pr-[84px]">
        {anyDone || filled ? (
          <Text className="text-sm text-muted">
            {selected === today ? 'C’est enregistré. Tu peux fermer l’app.' : 'C’est enregistré.'}
          </Text>
        ) : (
          <>
            <Text className="text-sm text-muted">Touche ce que tu as tenu.</Text>
            {habits.length > 0 && (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  markFilled(db, selected);
                  notifyChange();
                }}
              >
                <Text className="text-sm font-semibold underline">Rien de tenu ce jour-là</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}


// THIS IS REALLY BAD, WAY TOO DAYGRAPH ORIENTED. I'm not sure I like that welcome screen at all.
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
      <View className="mt-10 gap-3">
        <Title>Bienvenue</Title>
        <Text className="text-muted">
          Chaque soir, coche les habitudes que tu as tenues. Commence par récupérer ton historique Daygraph, ou crée ta
          première habitude.
        </Text>
      </View>
      <View className="mt-auto gap-3">
        <PrimaryButton
          label={importing ? 'Import en cours…' : 'Importer une sauvegarde Daygraph'}
          onPress={importing ? undefined : importBackup}
        />
        <PillButton label="Créer une habitude" onPress={() => router.push('/habits/new')} />
      </View>
    </Screen>
  );
}
