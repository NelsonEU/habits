import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import { type ReactNode, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Switch,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addReminder, deleteReminder, setReminderTime, setWelcomeDone } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import { HABIT_COLORS } from '@/domain/palette';
import { locale } from '@/i18n';
import { cn } from '@/lib/cn';
import { notificationPermission, requestNotificationPermission } from '@/reminders/notifications';
import { useTheme } from '@/theme';
import { PrimaryButton } from './buttons';
import { HabitCard } from './habit-card';
import { Icon } from './icon';
import { Text, Title } from './text';
import { TimeField } from './time-field';

const color = (id: string) => HABIT_COLORS.find((c) => c.id === id)!.hex;
const PAGES = 4;

/**
 * First launch: four short pages (what the app is, ticking, statistics, the daily reminder),
 * swiped or stepped through, skippable at any time. Shown in place of the day screen until it's
 * finished or skipped (settings.welcomeDone); the day screen then shows its empty state.
 */
export function Welcome() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const snapshot = useSnapshot();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const pager = useRef<ScrollView>(null);
  // A horizontal scroll view doesn't stretch its pages vertically: they get its measured height.
  const [height, setHeight] = useState(0);
  const [page, setPage] = useState(0);
  const goTo = (index: number) => {
    pager.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  };
  const onScrolled = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  // A new install comes with a daily reminder (migration 3): the last page edits it.
  const [remind, setRemind] = useState(true);
  const [time, setTime] = useState(snapshot.reminders[0]?.time ?? '22:00');
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    setBusy(true);
    // Asked here, with the reminder row on screen: the moment the permission makes sense.
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
  };

  const skip = () => {
    setWelcomeDone(db);
    notifyChange();
  };

  const last = page === PAGES - 1;
  const buttonLabel = page === 0 ? t('welcome.getStarted') : last ? t('welcome.start') : t('welcome.next');

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>
      <View className="h-12 flex-row items-center justify-between px-3">
        {page > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => goTo(page - 1)}
            className="size-11 items-center justify-center active:opacity-60"
          >
            <Icon name="back" size={20} color={colors.ink} />
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          accessibilityRole="button"
          onPress={busy ? undefined : skip}
          className="min-h-11 justify-center px-2 active:opacity-60"
        >
          <Text className="text-base font-semibold text-muted">{t('welcome.skip')}</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrolled}
        onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
        className="flex-1"
      >
        <Page width={width} height={height} title={t('welcome.intro.title')} body={t('welcome.intro.body')}>
          <View className="size-[168px] items-center justify-center self-center rounded-[44px] border border-line bg-surface">
            {/* A style, not a class: on web, Image sets the file's own size (1024) inline, which beats classes. */}
            <Image
              source={require('@/assets/images/splash-icon.png')}
              accessibilityIgnoresInvertColors
              style={{ width: 120, height: 120 }}
            />
          </View>
        </Page>
        <Page width={width} height={height} title={t('welcome.tick.title')} body={t('welcome.tick.body')}>
          <TickDemo />
        </Page>
        <Page width={width} height={height} title={t('welcome.progress.title')} body={t('welcome.progress.body')}>
          <ProgressDemo />
        </Page>
        <Page width={width} height={height} title={t('welcome.reminder.title')} body={t('welcome.reminder.body')}>
          <View className="gap-3">
            <View className="flex-row items-start gap-3 rounded-[22px] bg-control px-4 py-3.5">
              <Image
                source={require('@/assets/images/icon.png')}
                accessibilityIgnoresInvertColors
                style={{ width: 38, height: 38, borderRadius: 9 }}
              />
              <View className="flex-1 gap-0.5">
                <View className="flex-row justify-between">
                  <Text className="text-[13px] font-semibold">{t('reminders.notificationTitle')}</Text>
                  <Text className="text-[13px] text-muted">{time}</Text>
                </View>
                <Text>{t('reminders.notificationBody')}</Text>
              </View>
            </View>
            <View className="min-h-16 flex-row items-center gap-3 rounded-2xl border border-line bg-surface py-2 pl-4 pr-3">
              <Icon name="reminder" size={19} color={colors.muted} />
              <Text className="flex-1 text-base">{t('welcome.reminder.label')}</Text>
              {remind && <TimeField value={time} onChange={setTime} />}
              <Switch
                accessibilityLabel={t('welcome.reminder.label')}
                value={remind}
                onValueChange={setRemind}
                trackColor={{ true: colors.switchOn }}
              />
            </View>
          </View>
        </Page>
      </ScrollView>

      <View className="gap-6 px-5 pt-6">
        <View
          accessible
          accessibilityLabel={t('welcome.step', { n: page + 1, total: PAGES })}
          className="flex-row justify-center gap-2"
        >
          {Array.from({ length: PAGES }, (_, i) => (
            <View key={i} className={cn('h-2 rounded-full', i === page ? 'w-6 bg-ink' : 'w-2 bg-line-strong')} />
          ))}
        </View>
        <PrimaryButton label={buttonLabel} onPress={busy ? undefined : last ? finish : () => goTo(page + 1)} />
      </View>
    </View>
  );
}

/** One page: an illustration on top, then a title and one line. */
function Page({
  width,
  height,
  title,
  body,
  children,
}: {
  width: number;
  height: number;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <View style={{ width, height }} className="px-5">
      <View className="flex-1 justify-center">{children}</View>
      <View className="gap-3 pt-8">
        <Title className="text-[34px] leading-[39px] tracking-[-0.5px]">{title}</Title>
        <Text className="text-[17px] leading-[25px] text-muted">{body}</Text>
      </View>
    </View>
  );
}

/** Two habit cards to try ticking, one already ticked. */
function TickDemo() {
  const { t } = useTranslation();
  const [walk, setWalk] = useState(true);
  const [read, setRead] = useState(false);
  const toggle = (checked: boolean, set: (v: boolean) => void) => {
    if (checked) Haptics.selectionAsync();
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    set(!checked);
  };
  return (
    <View className="gap-3">
      <HabitCard
        name={t('habits.suggestions.walk')}
        color={color('mint')}
        checked={walk}
        subtitle={t('day.streak', { count: walk ? 3 : 2 })}
        onToggle={() => toggle(walk, setWalk)}
      />
      <HabitCard
        name={t('habits.suggestions.read')}
        color={color('rose')}
        checked={read}
        subtitle={t('welcome.tick.hint')}
        onToggle={() => toggle(read, setRead)}
      />
    </View>
  );
}

const DEMO_WEEK = [
  { key: 'walk', color: 'mint', ticks: '1111111' },
  { key: 'read', color: 'rose', ticks: '1101110' },
  { key: 'screens', color: 'blue', ticks: '0110100' },
] as const;

/** A streak, a monthly rate and a week of dots, with made-up values. */
function ProgressDemo() {
  const { t } = useTranslation();
  const { mark } = useTheme();
  // Narrow weekday letters from a known Monday, in the phone's language.
  const letters = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(new Date(2026, 0, 5 + i)),
  );
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <Tile value="12" label={t('welcome.progress.streak')} color={mark(color('amber'))} />
        <Tile value="86%" label={t('welcome.progress.rate')} color={mark(color('mint'))} />
      </View>
      <View className="gap-3.5 rounded-3xl border border-line bg-surface px-5 py-[18px]">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-[13px] font-semibold text-faint">{t('welcome.progress.thisWeek')}</Text>
          {letters.map((letter, i) => (
            <Text key={i} className="w-3.5 text-center text-xs font-semibold text-faint">
              {letter}
            </Text>
          ))}
        </View>
        {DEMO_WEEK.map((habit) => (
          <View key={habit.key} className="flex-row items-center gap-2">
            <Text numberOfLines={1} className="flex-1 font-semibold">
              {t(`habits.suggestions.${habit.key}`)}
            </Text>
            {habit.ticks.split('').map((tick, i) => (
              <View
                key={i}
                className={cn('size-3.5 rounded-full', tick === '0' && 'bg-empty')}
                // The habit's color is data, not a class.
                style={tick === '1' ? { backgroundColor: mark(color(habit.color)) } : undefined}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function Tile({ value, label, color: tint }: { value: string; label: string; color: string }) {
  return (
    <View className="flex-1 gap-1 rounded-3xl border border-line bg-surface px-5 py-[18px]">
      <Text className="font-display text-[40px] font-bold leading-[44px]" style={{ color: tint }}>
        {value}
      </Text>
      <Text className="text-[13px] leading-[18px] text-muted">{label}</Text>
    </View>
  );
}
