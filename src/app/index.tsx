import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, View } from 'react-native';

import { ImportError } from '@/backup/errors';
import { pickBackup } from '@/backup/files';
import { setPendingImport } from '@/backup/pending';
import { Fab, IconButton, PillButton, PrimaryButton, SecondaryButton } from '@/components/buttons';
import { HabitCard } from '@/components/habit-card';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';
import { WeekNav, WeekPager } from '@/components/week-strip';
import { setChecked } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import { addDays, type Day, startOfWeek } from '@/domain/day';
import { dayDots, weekBounds } from '@/domain/day-view';
import { habitsOn, historyOf } from '@/domain/model';
import { currentStreak } from '@/domain/stats';
import { useToday } from '@/hooks/use-today';
import { locale } from '@/i18n';
import { longDay } from '@/i18n/format';

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
  // Realigned on every render: the week start setting may have changed since the week was picked.
  const weekStart = startOfWeek(pickedWeek ?? selected, snapshot.settings.weekStartsOn);
  const bounds = weekBounds(snapshot, today, snapshot.settings.weekStartsOn);

  const habits = habitsOn(snapshot, selected);
  const anyDone = habits.some((h) => snapshot.checks.get(h.id)?.has(selected));

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
        <WeekPager
          first={bounds.first}
          last={bounds.last}
          weekStart={weekStart}
          onWeekChange={setPickedWeek}
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
            {selected >= addDays(today, -1) ? longDay(selected, locale) : t('day.pastDay')}
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
        <View className="mt-auto min-h-[60px] justify-center pr-[84px]">
          <Text className="text-sm text-muted">
            {!anyDone ? t('day.tapPrompt') : selected === today ? t('day.savedToday') : t('day.saved')}
          </Text>
        </View>
      )}
    </Screen>
  );
}


/** A brand-new app: in place of the habit cards, create a first habit or import existing data. */
function EmptyState({ today }: { today: Day }) {
  const { t } = useTranslation();
  const [importing, setImporting] = useState(false);

  // Reads the file, then shows what it contains on the import screen before anything changes.
  const importData = async () => {
    setImporting(true);
    try {
      const picked = await pickBackup(today);
      if (picked) {
        setPendingImport({ backup: picked.backup, source: { kind: 'file', name: picked.fileName } });
        router.push('/import');
      }
    } catch (e) {
      if (!(e instanceof ImportError)) throw e;
      Alert.alert(t('import.failedTitle'), t(`import.errors.${e.code}`, e.params));
    } finally {
      setImporting(false);
    }
  };

  return (
    <View className="items-center gap-6 rounded-3xl border border-line bg-surface px-6 pb-6 pt-8">
      {/* The logo's mark (ring and moon): the same evening ritual the app is about. */}
      <Image source={require('@/assets/images/splash-icon.png')} accessibilityIgnoresInvertColors className="size-24" />
      <View className="items-center gap-2">
        <Title className="text-center text-[26px] leading-8 tracking-[-0.4px]">{t('empty.title')}</Title>
        <Text className="text-center text-muted">{t('empty.body')}</Text>
      </View>
      <View className="w-full gap-3">
        <PrimaryButton label={t('empty.create')} onPress={() => router.push('/habits/new')} />
        <SecondaryButton
          label={importing ? t('empty.importing') : t('empty.import')}
          onPress={importing ? undefined : importData}
        />
      </View>
    </View>
  );
}
