import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useSnapshot } from '@/db/store';
import type { Snapshot } from '@/domain/model';
import { reminderMoments } from '@/domain/reminders';
import i18n from '@/i18n';

/*
 * Local notifications only: scheduled on the phone, no server and no push.
 * (The push entitlement is removed at build time, see plugins/without-push-entitlement.js.)
 */

// A reminder arriving while the app is open still shows, as a banner.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type Permission = 'granted' | 'undetermined' | 'denied';

const toPermission = (p: Notifications.NotificationPermissionsStatus): Permission =>
  p.granted || p.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    ? 'granted'
    : p.ios?.status === Notifications.IosAuthorizationStatus.NOT_DETERMINED || p.status === 'undetermined'
      ? 'undetermined'
      : 'denied';

export async function notificationPermission(): Promise<Permission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

/** Shows iOS's permission prompt (only the first time; afterwards it's in the iPhone's Settings). */
export async function requestNotificationPermission(): Promise<Permission> {
  return toPermission(await Notifications.requestPermissionsAsync());
}

/** Replaces every scheduled reminder with the ones the current data calls for. */
async function syncReminders(snapshot: Snapshot) {
  if ((await notificationPermission()) !== 'granted') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Text in the current language, frozen at scheduling time: rescheduled on each app start anyway.
  const content = { title: i18n.t('reminders.notificationTitle'), body: i18n.t('reminders.notificationBody') };
  for (const date of reminderMoments(snapshot.reminders, snapshot.filled, new Date())) {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  }
}

// Syncs run one after another: overlapping "cancel all, then schedule" runs could leave duplicates.
let queue = Promise.resolve();
export function scheduleSync(snapshot: Snapshot) {
  queue = queue
    .then(() => syncReminders(snapshot))
    .catch((e) => {
      // A failed sync shouldn't break the app, but shouldn't be silent either.
      console.warn('Reminder sync failed', e);
    });
  return queue;
}

/** How many notifications iOS actually holds for the app, once pending syncs are done. */
export async function scheduledCount(): Promise<number> {
  await queue;
  return (await Notifications.getAllScheduledNotificationsAsync()).length;
}

/**
 * Keeps the scheduled reminders in step with the data: after every change
 * (a tick, a filled-in day, a reminder edited) and each time the app comes back.
 */
export function useReminderSync() {
  const snapshot = useSnapshot();

  useEffect(() => {
    scheduleSync(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') scheduleSync(snapshot);
    });
    return () => subscription.remove();
  }, [snapshot]);
}
