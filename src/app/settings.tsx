import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AppState, Linking, Pressable, View } from 'react-native';

import { ImportError } from '@/backup/errors';
import { exportAndShare, pickBackup, readSafetyCopy, safetyCopyDate, saveSafetyCopy } from '@/backup/files';
import { setPendingImport } from '@/backup/pending';
import { BackLink } from '@/components/buttons';
import { Screen } from '@/components/screen';
import { SettingsRow, SettingsSection } from '@/components/settings-list';
import { Text, Title } from '@/components/text';
import { addReminder, deleteReminder, replaceAll, setReminderTime, setTheme, setWeekStart } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import { addDays, toDay } from '@/domain/day';
import { fromTime, reminderMoments, toTime } from '@/domain/reminders';
import { useToday } from '@/hooks/use-today';
import { locale } from '@/i18n';
import { longDay } from '@/i18n/format';
import {
  notificationPermission,
  type Permission,
  requestNotificationPermission,
  scheduledCount,
} from '@/reminders/notifications';
import { useTheme } from '@/theme';
import { cn } from '@/lib/cn';

/** 4 · Réglages. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  const db = useSQLiteContext();
  const snapshot = useSnapshot();
  const today = useToday();
  const { weekStartsOn, theme } = snapshot.settings;

  // Re-read whenever the screen shows again: coming back from a "replace" creates a new copy.
  const [copyDate, setCopyDate] = useState<Date | null>(null);
  useFocusEffect(useCallback(() => setCopyDate(safetyCopyDate()), []));

  // Re-read when the screen shows and when the app comes back (e.g. from the iPhone's Settings).
  const [permission, setPermission] = useState<Permission | null>(null);
  const refreshPermission = useCallback(() => {
    notificationPermission().then(setPermission);
  }, []);
  useFocusEffect(refreshPermission);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => state === 'active' && refreshPermission());
    return () => subscription.remove();
  }, [refreshPermission]);

  // The next reminder, from the same plan that schedules them, and (in development) how many
  // iOS really holds. Recomputed after every change, once the reschedule triggered by it is done.
  const [next, setNext] = useState<{ moment: Date | null; scheduled: number } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const moment = reminderMoments(snapshot.reminders, snapshot.filled, new Date())[0] ?? null;
    scheduledCount()
      .catch(() => 0)
      .then((scheduled) => !cancelled && setNext({ moment, scheduled }));
    return () => {
      cancelled = true;
    };
  }, [snapshot, permission]);

  const nextText = (moment: Date) => {
    const day = toDay(moment);
    const time = moment.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const when =
      day === today
        ? t('settings.nextToday', { time })
        : day === addDays(today, 1)
          ? t('settings.nextTomorrow', { time })
          : t('settings.nextOn', { day: longDay(day, locale), time });
    return t('settings.nextReminder', { when });
  };

  const change = (write: () => void) => {
    write();
    notifyChange();
  };

  const askPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    // Rescheduling follows the data, which didn't change: nudge it so the reminders get scheduled now.
    if (result === 'granted') notifyChange();
  };

  const addNewReminder = () => {
    const taken = new Set(snapshot.reminders.map((r) => r.time));
    // 21:00, or the next free hour after the latest reminder.
    let hour = 21;
    while (taken.has(`${String(hour % 24).padStart(2, '0')}:00`) && hour < 45) hour++;
    change(() => addReminder(db, `${String(hour % 24).padStart(2, '0')}:00`));
    // In context: the first reminder is when the permission makes sense.
    if (permission === 'undetermined') askPermission();
  };

  const sendFeedback = async () => {
    const address = process.env.EXPO_PUBLIC_FEEDBACK_EMAIL ?? '';
    try {
      await Linking.openURL(`mailto:${address}?subject=${encodeURIComponent(t('settings.feedbackSubject'))}`);
    } catch {
      Alert.alert(t('settings.noMailApp'));
    }
  };

  const showImportError = (e: unknown) => {
    if (!(e instanceof ImportError)) throw e;
    Alert.alert(t('import.failedTitle'), t(`import.errors.${e.code}`, e.params));
  };

  const importFile = async () => {
    try {
      const picked = await pickBackup(today);
      if (!picked) return;
      setPendingImport({ backup: picked.backup, source: { kind: 'file', name: picked.fileName } });
      router.push('/import');
    } catch (e) {
      showImportError(e);
    }
  };

  const restoreCopy = async () => {
    try {
      setPendingImport({ backup: await readSafetyCopy(today), source: { kind: 'safety-copy', date: copyDate } });
      router.push('/import');
    } catch (e) {
      showImportError(e);
    }
  };

  // TEMPORARY, development builds only: wipes everything, after saving the safety copy.
  const confirmClearAll = () =>
    Alert.alert(t('settings.clearAllConfirmTitle'), t('settings.clearAllConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.clearAllConfirm'),
        style: 'destructive',
        onPress: () => {
          saveSafetyCopy(snapshot);
          change(() => replaceAll(db, { habits: [], filledDays: [] }));
          setCopyDate(safetyCopyDate());
        },
      },
    ]);

  const exportData = async () => {
    try {
      await exportAndShare(snapshot, today);
    } catch (e) {
      Alert.alert(t('settings.exportFailed'), e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.back')} fallback="/" chevron />
        <Title>{t('settings.title')}</Title>
      </View>

      <SettingsSection title={t('settings.displaySection')}>
        <View className="gap-3 px-4 py-4">
          <Text nativeID="theme-label" className="text-[17px] font-semibold">
            {t('settings.theme')}
          </Text>
          <View accessibilityRole="radiogroup" accessibilityLabelledBy="theme-label" className="flex-row gap-1 rounded-[14px] bg-control p-1">
            {(
              [
                ['light', t('settings.themeLight')],
                ['dark', t('settings.themeDark')],
                ['system', t('settings.themeSystem')],
              ] as const
            ).map(([value, label]) => {
              const selected = theme === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  onPress={() => change(() => setTheme(db, value))}
                  // No shadow on the selected segment: NativeWind can't add a shadow class to a component
                  // after its first render (it switches its internal rendering and crashed this screen).
                  className={cn(
                    'min-h-11 flex-1 items-center justify-center rounded-[11px] active:opacity-70',
                    selected && (scheme === 'light' ? 'bg-surface' : 'bg-line-strong'),
                  )}
                >
                  <Text className={cn('font-semibold', !selected && 'text-muted')}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <SettingsRow
          icon="calendar"
          label={t('settings.weekStartsOn')}
          value={weekStartsOn === 'monday' ? t('settings.monday') : t('settings.sunday')}
          // One tap switches between the two, as in the mockup.
          onPress={() => change(() => setWeekStart(db, weekStartsOn === 'monday' ? 'sunday' : 'monday'))}
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.remindersSection')}
        footer={[
          next?.moment && permission === 'granted' ? nextText(next.moment) : null,
          t('settings.remindersHint'),
          __DEV__ && next ? t('settings.scheduledDebug', { count: next.scheduled }) : null,
        ]
          .filter(Boolean)
          .join('\n')}
      >
        {permission === 'denied' && snapshot.reminders.length > 0 && (
          <SettingsRow
            icon="bell.slash"
            tone="warning"
            label={t('settings.notificationsDenied')}
            detail={t('settings.notificationsDeniedHint')}
            onPress={() => Linking.openSettings()}
          />
        )}
        {permission === 'undetermined' && snapshot.reminders.length > 0 && (
          <SettingsRow
            icon="bell.badge"
            label={t('settings.enableNotifications')}
            detail={t('settings.enableNotificationsHint')}
            onPress={askPermission}
          />
        )}
        {snapshot.reminders.map((reminder) => (
          <SettingsRow
            key={reminder.id}
            icon="bell"
            label={t('settings.reminder')}
            trailing={
              <View className="flex-row items-center gap-1">
                <DateTimePicker
                  value={fromTime(reminder.time)}
                  mode="time"
                  display="compact"
                  themeVariant={scheme}
                  locale={locale}
                  accentColor={colors.ink}
                  onValueChange={(_, date) => change(() => setReminderTime(db, reminder.id, toTime(date)))}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('settings.removeReminder', { time: reminder.time })}
                  hitSlop={8}
                  onPress={() => change(() => deleteReminder(db, reminder.id))}
                  className="size-11 items-center justify-center active:opacity-60"
                >
                  <SymbolView name="minus.circle" size={20} tintColor={colors.muted} />
                </Pressable>
              </View>
            }
          />
        ))}
        <SettingsRow icon="plus" label={t('settings.addReminder')} onPress={addNewReminder} />
      </SettingsSection>

      <SettingsSection title={t('settings.backupSection')} footer={t('settings.backupHint')}>
        <SettingsRow icon="square.and.arrow.up" label={t('settings.export')} onPress={exportData} />
        <SettingsRow icon="square.and.arrow.down" label={t('settings.import')} onPress={importFile} />
        {copyDate && (
          <SettingsRow
            icon="arrow.uturn.backward"
            label={t('settings.restoreCopy')}
            detail={t('settings.restoreCopyHint', {
              date: copyDate.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }),
            })}
            onPress={restoreCopy}
          />
        )}
      </SettingsSection>

      <SettingsSection>
        <SettingsRow icon="envelope" label={t('settings.feedback')} detail={t('settings.feedbackHint')} onPress={sendFeedback} />
      </SettingsSection>

      {__DEV__ && (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            onPress={confirmClearAll}
            className="min-h-14 items-center justify-center rounded-full bg-danger px-5 active:opacity-70"
          >
            <Text className="text-[17px] font-semibold text-on-danger">{t('settings.clearAll')}</Text>
          </Pressable>
          <Text className="mx-1 text-[13px] leading-[19px] text-muted">{t('settings.clearAllHint')}</Text>
        </View>
      )}
    </Screen>
  );
}
