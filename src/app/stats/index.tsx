import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { Screen } from '@/components/screen';
import { MiniTrend, StatTile, TrendLine } from '@/components/stats';
import { Text, Title } from '@/components/text';
import { useSnapshot } from '@/db/store';
import { habitStats } from '@/domain/habit-stats';
import { useToday } from '@/hooks/use-today';
import { daysValue, rateValue, recordValue, trend } from '@/i18n/stats-text';
import { colors } from '@/theme';

// Becomes a setting in step 6.
const WEEK_STARTS_ON = 'monday';

/** 2 · Statistiques — one card per active habit. */
export default function StatsScreen() {
  const { t } = useTranslation();
  const snapshot = useSnapshot();
  const today = useToday();
  const active = snapshot.habits.filter((h) => h.archivedAt === null);

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.today')} fallback="/" chevron />
        <Title>{t('stats.title')}</Title>
      </View>

      <View className="gap-3">
        {active.map((habit) => {
          const s = habitStats(snapshot, habit, today, WEEK_STARTS_ON);
          const change = trend(t, s.last30, s.last30Previous);
          return (
            <Pressable
              key={habit.id}
              accessibilityRole="link"
              accessibilityLabel={habit.name}
              onPress={() => router.push(`/stats/${habit.id}`)}
              className="gap-4 rounded-[22px] border border-line bg-surface p-[18px] active:opacity-70"
            >
              <View className="flex-row items-center gap-2.5">
                <View className="size-2.5 rounded-full" style={{ backgroundColor: habit.color }} />
                <Text numberOfLines={1} className="flex-1 text-[17px] font-semibold">
                  {habit.name}
                </Text>
                <SymbolView name="chevron.right" size={15} weight="semibold" tintColor={colors.muted} />
              </View>
              <View className="flex-row gap-2">
                <StatTile className="flex-1" size="md" value={daysValue(t, s.streak)} label={t('stats.streak')} />
                <StatTile className="flex-1" size="md" value={recordValue(t, s.record)} label={t('stats.record')} />
                <StatTile className="flex-1" size="md" value={rateValue(t, s.last30.ratio)} label={t('stats.last30Short')}>
                  {change && <TrendLine trend={change} />}
                </StatTile>
              </View>
              <MiniTrend months={s.months} color={habit.color} />
            </Pressable>
          );
        })}
        {active.length === 0 && <Text className="text-muted">{t('stats.empty')}</Text>}
      </View>
    </Screen>
  );
}
