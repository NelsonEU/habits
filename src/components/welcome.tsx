import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, Switch, View } from 'react-native';

import { addReminder, deleteReminder, setReminderTime, setWelcomeDone } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import type { Day } from '@/domain/day';
import { HABIT_COLORS } from '@/domain/palette';
import { useImportFile } from '@/hooks/use-import-file';
import { notificationPermission, requestNotificationPermission } from '@/reminders/notifications';
import { useTheme } from '@/theme';
import { PrimaryButton, SecondaryButton } from './buttons';
import { HabitCard } from './habit-card';
import { Icon } from './icon';
import { Screen } from './screen';
import { Text, Title } from './text';
import { TimeField } from './time-field';

const DEMO_COLOR = HABIT_COLORS.find((c) => c.id === 'blue')!.hex;

/**
 * First launch: how the app works in one page, a card to try ticking, and the daily reminder.
 * Shown in place of the day screen until it's completed or skipped (settings.welcomeDone).
 */
export function Welcome({ today }: { today: Day }) {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const snapshot = useSnapshot();
  const { importing, importFile } = useImportFile(today);

  const [demoChecked, setDemoChecked] = useState(false);
  // A new install comes with a 22:00 reminder (migration 3): this row edits it.
  const [remind, setRemind] = useState(true);
  const [time, setTime] = useState(snapshot.reminders[0]?.time ?? '22:00');
  const [busy, setBusy] = useState(false);

  const toggleDemo = () => {
    if (demoChecked) Haptics.selectionAsync();
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDemoChecked(!demoChecked);
  };

  /** Saves the reminder choice and closes the page; `then` runs once the day screen is back. */
  const finish = async (then: () => void) => {
    setBusy(true);
    // Asked here, while the reminder row is on screen: the moment the permission makes sense.
    if (remind && (await notificationPermission()) === 'undetermined') await requestNotificationPermission();
    db.withTransactionSync(() => {
      const [first] = snapshot.reminders;
      if (!remind) snapshot.reminders.forEach((r) => deleteReminder(db, r.id));
      else if (first) setReminderTime(db, first.id, time);
      else addReminder(db, time);
      setWelcomeDone(db);
    });
    // Also schedules the reminders, now that the permission may have been granted.
    notifyChange();
    then();
  };

  const skip = () => {
    setWelcomeDone(db);
    notifyChange();
  };

  const steps = [t('welcome.steps.add'), t('welcome.steps.tick'), t('welcome.steps.stats')];

  return (
    <Screen scroll>
      <View className="items-center gap-4 pt-4">
        {/* A style, not a class: on web, Image sets the file's own size (1024) inline, which beats classes. */}
        <Image source={require('@/assets/images/splash-icon.png')} accessibilityIgnoresInvertColors style={{ width: 80, height: 80 }} />
        <Title className="text-center text-[32px] leading-[38px] tracking-[-0.5px]">{t('welcome.title')}</Title>
      </View>

      <View className="gap-5">
        {steps.map((step, i) => (
          <View key={step} className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="size-8 items-center justify-center rounded-full bg-control">
                <Text className="font-semibold">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-[17px] leading-6">{step}</Text>
            </View>
            {i === 1 && (
              <HabitCard
                name={t('welcome.demoName')}
                color={DEMO_COLOR}
                checked={demoChecked}
                subtitle={t('welcome.demoHint')}
                onToggle={toggleDemo}
              />
            )}
          </View>
        ))}
      </View>

      <View className="min-h-16 flex-row items-center gap-3 rounded-2xl border border-line bg-surface py-2 pl-4 pr-3">
        <Icon name="reminder" size={19} color={colors.muted} />
        <Text className="flex-1">{t('welcome.reminder')}</Text>
        {remind && <TimeField value={time} onChange={setTime} />}
        <Switch
          accessibilityLabel={t('welcome.reminder')}
          value={remind}
          onValueChange={setRemind}
          trackColor={{ true: colors.switchOn }}
        />
      </View>

      <View className="mt-auto gap-3">
        <PrimaryButton label={t('welcome.create')} onPress={busy ? undefined : () => finish(() => router.push('/habits/new'))} />
        <SecondaryButton
          label={importing ? t('empty.importing') : t('welcome.import')}
          onPress={busy || importing ? undefined : () => finish(importFile)}
        />
        <Pressable
          accessibilityRole="button"
          onPress={busy ? undefined : skip}
          className="min-h-11 items-center justify-center self-center px-4 active:opacity-60"
        >
          <Text className="text-muted">{t('welcome.skip')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
