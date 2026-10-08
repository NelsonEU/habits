import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Screen } from '@/components/screen';
import { CalendarGrid, HBars, MonthBars, StatTile, StatsSection, TrendLine } from '@/components/stats';
import { Text, Title } from '@/components/text';
import { useSnapshot } from '@/db/store';
import { habitStats } from '@/domain/habit-stats';
import { useToday } from '@/hooks/use-today';
import { locale } from '@/i18n';
import { monthYear, weekdayLong, weekdayShort } from '@/i18n/format';
import { useTheme } from '@/theme';
import { daysValue, progressSentence, rateValue, recordLabel, recordValue, trend } from '@/i18n/stats-text';

/** 3 · Détail d’une habitude — the four questions of the brief, in order. */
export default function HabitDetailScreen() {
  const { t } = useTranslation();
  const { mark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const snapshot = useSnapshot();
  const today = useToday();
  const habit = snapshot.habits.find((h) => h.id === Number(id));

  // Deleted or unknown (e.g. an old link): only the way back.
  if (!habit) {
    return (
      <Screen>
        <BackLink label={t('stats.title')} fallback="/stats" chevron />
      </Screen>
    );
  }

  const s = habitStats(snapshot, habit, today, snapshot.settings.weekStartsOn);
  const change = trend(t, s.last30, s.last30Previous);
  const ext = s.weekdayExtremes;

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('stats.title')} fallback="/stats" chevron />
        <View className="flex-row items-center gap-3">
          <View className="size-3.5 rounded-full" style={{ backgroundColor: mark(habit.color) }} />
          <Title className="flex-1 text-4xl leading-[40px]">{habit.name}</Title>
        </View>
        {habit.archivedAt && <Text className="text-sm text-muted">{t('stats.archived')}</Text>}
      </View>

      <StatsSection title={t('stats.whereTitle')}>
        <View className="flex-row gap-2">
          {[
            { value: daysValue(t, s.streak), label: t('stats.streak') },
            { value: recordValue(t, s.record), label: recordLabel(t, s.record) },
            {
              value: rateValue(t, s.last30.ratio),
              label: t('stats.last30'),
              extra: change && <TrendLine trend={change} />,
            },
          ].map((tile) => (
            <View key={tile.label} className="flex-1 rounded-[18px] bg-surface p-3.5">
              <StatTile value={tile.value} label={tile.label}>
                {tile.extra}
              </StatTile>
            </View>
          ))}
        </View>
      </StatsSection>

      <StatsSection title={t('stats.progressTitle')} sentence={progressSentence(t, s.years) ?? undefined}>
        <View className="gap-4 rounded-[18px] bg-surface px-3.5 pb-3 pt-4">
          <MonthBars months={s.months} color={habit.color} />
          <Text className="text-xs text-faint">
            {t('stats.monthsCaption', {
              from: monthYear(s.months[0].month, locale),
              to: monthYear(s.months[s.months.length - 1].month, locale),
            })}
            {' · '}
            {t('stats.tapHint')}
          </Text>
          {s.years.length > 1 && (
            <View className="gap-2.5 border-t border-line pt-3.5">
              <Text className="text-xs font-semibold text-muted">{t('stats.byYear')}</Text>
              <HBars
                color={habit.color}
                rows={s.years.map((y) => ({ label: String(y.year), rate: y }))}
                // Every year shows its value: there are only a few, and comparing them is the point.
                emphasized={s.years.map((_, i) => i)}
              />
            </View>
          )}
        </View>
      </StatsSection>

      <StatsSection
        title={t('stats.weekdaysTitle')}
        sentence={
          ext
            ? t('stats.weekdaysSentence', {
                hardest: weekdayLong(s.weekdays[ext.hardest].index, locale),
                easiest: weekdayLong(s.weekdays[ext.easiest].index, locale),
              })
            : t('stats.weekdaysEven')
        }
      >
        <View className="rounded-[18px] bg-surface p-3.5">
          <HBars
            color={habit.color}
            rows={s.weekdays.map((w) => ({
              label: weekdayShort(w.index, locale),
              a11yLabel: weekdayLong(w.index, locale),
              rate: w.rate,
            }))}
            emphasized={ext ? [ext.hardest, ext.easiest] : []}
          />
        </View>
      </StatsSection>

      <StatsSection title={t('stats.calendarTitle')}>
        <View className="rounded-[18px] bg-surface p-3.5">
          <CalendarGrid weeks={s.calendar} color={habit.color} weekStartsOn={snapshot.settings.weekStartsOn} />
        </View>
      </StatsSection>
    </Screen>
  );
}
