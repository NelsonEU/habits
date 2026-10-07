import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Fab, IconButton, PillButton, PrimaryButton } from '@/components/buttons';
import { HabitCard } from '@/components/habit-card';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';
import { WeekDays, WeekNav } from '@/components/week-strip';
import { markFilled, setChecked } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import { addDays, type Day, startOfWeek } from '@/domain/day';
import { dayDots, weekBounds } from '@/domain/day-view';
import { habitsOn, historyOf } from '@/domain/model';
import { currentStreak } from '@/domain/stats';
import { useToday } from '@/hooks/use-today';
import { locale } from '@/i18n';
import { longDay } from '@/i18n/format';
import { ImportError } from '@/import/errors';
import { pickAndImport } from '@/import/pick';

// Becomes a setting in step 6.
const WEEK_STARTS_ON = 'monday';

/** 1 · Le jour — opens on today. */
export default function DayScreen() {
  const { t } = useTranslation();
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

  return (
    <Screen scroll overlay={<Fab icon="pencil" label={t('day.editHabits')} onPress={() => router.push('/habits')} />}>
      <View className="gap-3.5">
        <View className="flex-row items-center gap-2">
          <WeekNav
            weekStart={weekStart}
            onPrev={weekStart > bounds.first ? () => setPickedWeek(addDays(weekStart, -7)) : null}
            onNext={weekStart < bounds.last ? () => setPickedWeek(addDays(weekStart, 7)) : null}
          />
          <IconButton icon="chart.bar" label={t('day.statistics')} onPress={() => router.push('/stats')} />
          <IconButton icon="slider.horizontal.3" label={t('day.settings')} onPress={() => router.push('/settings')} />
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
          <Title className="text-4xl leading-[38px]">{selected === today
              ? t('common.today')
              : selected === addDays(today, -1)
                ? t('day.yesterday')
                : longDay(selected, locale)}</Title>
          <Text className="text-sm text-muted">
            {selected >= addDays(today, -1)
              ? longDay(selected, locale)
              : filled
                ? t('day.pastDay')
                : t('day.unfilledDay')}
          </Text>
        </View>
        {selected !== today && <PillButton label={t('common.today')} onPress={goToday} />}
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
              subtitle={t('day.streak', { count: currentStreak(historyOf(snapshot, h), selected) })}
              onToggle={() => toggle(h.id, checked)}
            />
          );
        })}
        {snapshot.habits.length === 0 ? (
          <EmptyState today={today} />
        ) : (
          habits.length === 0 && (
            <Text className="text-muted">{t('day.noActiveHabits')}</Text>
          )
        )}
      </View>

      {habits.length > 0 && (
        <View className="mt-auto min-h-[60px] justify-center gap-1.5 pr-[84px]">
          {anyDone || filled ? (
            <Text className="text-sm text-muted">
              {selected === today ? t('day.savedToday') : t('day.saved')}
            </Text>
          ) : (
            <>
              <Text className="text-sm text-muted">{t('day.tapPrompt')}</Text>
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  markFilled(db, selected);
                  notifyChange();
                }}
              >
                <Text className="text-sm font-semibold underline">{t('day.nothingKept')}</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </Screen>
  );
}


/** A brand-new app: in place of the habit cards, create a first habit or import existing data. */
function EmptyState({ today }: { today: Day }) {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const [importing, setImporting] = useState(false);

  const importData = async () => {
    setImporting(true);
    try {
      const result = await pickAndImport(db, today);
      if (result) {
        Alert.alert(
          t('import.doneTitle'),
          t('import.doneBody', { count: result.habits, checks: result.checks.toLocaleString(locale) }),
        );
      }
    } catch (e) {
      if (!(e instanceof ImportError)) throw e;
      Alert.alert(t('import.failedTitle'), t(`import.errors.${e.code}`, e.params));
    } finally {
      setImporting(false);
    }
  };

  return (
    <View className="gap-5 rounded-3xl border border-line bg-surface p-5">
      <View className="gap-1.5">
        <Text className="text-xl font-semibold leading-6">{t('empty.title')}</Text>
        <Text className="text-muted">{t('empty.body')}</Text>
      </View>
      <View className="gap-3">
        <PrimaryButton label={t('empty.create')} onPress={() => router.push('/habits/new')} />
        <PillButton
          label={importing ? t('empty.importing') : t('empty.import')}
          onPress={importing ? undefined : importData}
        />
      </View>
    </View>
  );
}
