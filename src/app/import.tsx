import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { summarize } from '@/backup/backup';
import { saveSafetyCopy } from '@/backup/files';
import { planMerge } from '@/backup/merge';
import { getPendingImport, setPendingImport } from '@/backup/pending';
import { BackLink, PrimaryButton, SecondaryButton } from '@/components/buttons';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';
import { applyMerge, replaceAll } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import { locale } from '@/i18n';
import { shortDate } from '@/i18n/format';
import { useTheme } from '@/theme';

/**
 * Shows what a backup contains before anything changes, then merges it or
 * replaces the app's data with it. An empty app simply imports.
 */
export default function ImportScreen() {
  const { t } = useTranslation();
  const { mark } = useTheme();
  const db = useSQLiteContext();
  const snapshot = useSnapshot();
  // Read once: the pending import is cleared when it's applied, but this screen stays briefly visible.
  const [pending] = useState(getPendingImport);
  // Taps made while the (synchronous) import runs are queued, then delivered: without this guard,
  // a few impatient taps ran the import several times in a row.
  const busy = useRef(false);

  // Nothing to import (e.g. the app restarted on this screen): just leave.
  if (!pending) {
    return (
      <Screen>
        <BackLink label={t('common.cancel')} fallback="/" />
      </Screen>
    );
  }

  const { backup, source } = pending;
  const summary = summarize(backup);
  const appIsEmpty = snapshot.habits.length === 0;
  const current = {
    count: snapshot.habits.length,
    checks: [...snapshot.checks.values()].reduce((n, days) => n + days.size, 0),
  };

  const once = (action: () => void) => () => {
    if (busy.current) return;
    busy.current = true;
    action();
  };

  const finish = (title: string, body?: string) => {
    setPendingImport(null);
    notifyChange();
    router.back();
    Alert.alert(title, body);
  };

  const importIntoEmptyApp = once(() => {
    replaceAll(db, backup);
    finish(t('import.doneTitle'), t('import.doneBody', { count: summary.habits, checks: summary.checks }));
  });

  const merge = once(() => {
    const plan = planMerge(snapshot, backup);
    applyMerge(db, plan);
    finish(
      t('import.mergedTitle'),
      t('import.mergedBody', {
        habits: plan.inserts.length,
        checks: plan.updates.reduce((n, u) => n + u.addChecks.length, 0) + plan.inserts.reduce((n, h) => n + h.checks.length, 0),
      }),
    );
  });

  const confirmReplace = () =>
    Alert.alert(t('import.replaceConfirmTitle'), t('import.replaceConfirmBody', current), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('import.replaceConfirm'),
        style: 'destructive',
        onPress: once(() => {
          // The safety copy first: if it can't be written, nothing is replaced.
          saveSafetyCopy(snapshot);
          replaceAll(db, backup);
          finish(t('import.replacedTitle'));
        }),
      },
    ]);

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.cancel')} fallback="/settings" />
        <Title>{t('import.title')}</Title>
        <Text className="text-sm text-muted">
          {source.kind === 'file'
            ? t('import.fromFile', { name: source.name })
            : t('import.fromCopy', {
                date: source.date?.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) ?? '—',
              })}
        </Text>
      </View>

      <View className="gap-4 rounded-3xl border border-line bg-surface p-5">
        <View className="gap-1">
          <Text className="text-lg font-semibold">
            {t('import.summary', { count: summary.habits, checks: summary.checks.toLocaleString(locale) })}
          </Text>
          <Text className="text-sm text-muted">
            {summary.first && summary.last
              ? t('import.range', { first: shortDate(summary.first, locale), last: shortDate(summary.last, locale) })
              : t('import.noTicks')}
          </Text>
        </View>
        <View className="gap-2.5">
          {backup.habits.map((h, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View className="size-2.5 rounded-full" style={{ backgroundColor: mark(h.color) }} />
              <Text numberOfLines={1} className={h.archivedAt ? 'flex-1 text-faint' : 'flex-1'}>
                {h.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className="mt-auto gap-5">
        {appIsEmpty ? (
          <PrimaryButton label={t('import.importButton')} onPress={importIntoEmptyApp} />
        ) : (
          <>
            <View className="gap-2">
              <PrimaryButton label={t('import.merge')} onPress={merge} />
              <Text className="text-center text-[13px] text-muted">{t('import.mergeHint')}</Text>
            </View>
            <View className="gap-2">
              <SecondaryButton tone="danger" label={t('import.replace')} onPress={confirmReplace} />
              <Text className="text-center text-[13px] leading-[19px] text-muted">{t('import.replaceHint')}</Text>
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}
