import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

import type { CalendarCell } from '@/domain/calendar';
import type { Month } from '@/domain/day';
import type { WeekStart } from '@/domain/model';
import type { Rate } from '@/domain/stats';
import { locale } from '@/i18n';
import { longDay, monthLetter, monthShort, monthYear, percent } from '@/i18n/format';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme';
import { Text } from './text';

/*
 * Charts for one habit at a time, drawn with plain Views. Marks wear the
 * habit's color (its readable variant for the theme, via useTheme().mark); every number is in text colors. Bars are at most 24pt wide
 * with a 4pt rounded data-end. Values are shown sparingly (the headline is in
 * the section's sentence) and revealed by tapping a bar; VoiceOver reads every one.
 */

const ratioText = (rate: Rate, t: (k: 'stats.noData') => string) =>
  rate.ratio === null ? t('stats.noData') : percent(rate.ratio, locale);

/** A section of the detail screen: a question as title, its answer as a sentence, then the chart. */
export function StatsSection({ title, sentence, children }: { title: string; sentence?: string; children: ReactNode }) {
  return (
    <View className="gap-3.5">
      <Text accessibilityRole="header" className="font-display text-[21px] font-bold leading-[26px]">
        {title}
      </Text>
      {sentence && <Text className="leading-[22px] text-soft">{sentence}</Text>}
      {children}
    </View>
  );
}

/**
 * One figure with its label, e.g. "19 j / Record · août 2026". It doesn't size itself:
 * pass `className="flex-1"` to share a row (flex-1 inside a column would collapse it to zero height).
 */
export function StatTile({
  value,
  label,
  size = 'lg',
  className,
  children,
}: {
  value: string;
  label: string;
  size?: 'md' | 'lg';
  className?: string;
  /** An extra line under the label, e.g. a TrendLine. */
  children?: ReactNode;
}) {
  return (
    <View className={cn('min-w-0 gap-1', className)}>
      <Text className={cn('font-semibold', size === 'lg' ? 'text-[30px] leading-[34px]' : 'text-[26px] leading-[30px]')}>
        {value}
      </Text>
      <Text className="text-xs leading-4 text-muted">{label}</Text>
      {children}
    </View>
  );
}

/** "↓ 87 % avant": where the rate was in the previous 30 days. Neutral colors: a change isn't a verdict. */
export function TrendLine({ trend }: { trend: { direction: 'up' | 'down' | 'same'; pct: string; text: string } }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const icon = trend.direction === 'up' ? 'arrow.up' : trend.direction === 'down' ? 'arrow.down' : 'equal';
  return (
    <View accessible accessibilityLabel={t('stats.trendA11y', { pct: trend.pct })} className="flex-row items-center gap-1">
      <SymbolView name={icon} size={10} weight="bold" tintColor={colors.muted} />
      <Text className="text-xs leading-4 text-muted">{trend.text}</Text>
    </View>
  );
}

/** The 12-month trend of an overview card: bars only, the card itself carries the numbers. */
export function MiniTrend({ months, color: habitColor }: { months: (Rate & { month: Month })[]; color: string }) {
  const color = useTheme().mark(habitColor);
  const height = 34;
  return (
    <View className="gap-1.5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View className="flex-row items-end gap-1" style={{ height }}>
        {months.map((m) => (
          <View key={m.month} className="flex-1 items-center justify-end" style={{ height }}>
            {m.ratio !== null && (
              <View
                className={cn('w-full rounded-t-[2px]', m.ratio === 0 && 'bg-empty')}
                style={{ height: Math.max(2, Math.round(m.ratio * height)), backgroundColor: m.ratio > 0 ? color : undefined }}
              />
            )}
          </View>
        ))}
      </View>
      <View className="flex-row justify-between">
        <Text className="text-[11px] text-faint">{monthYear(months[0].month, locale)}</Text>
        <Text className="text-[11px] text-faint">{monthYear(months[months.length - 1].month, locale)}</Text>
      </View>
    </View>
  );
}

/** % of days kept per month. The latest month's value shows; tap another bar to see its own. */
export function MonthBars({ months, color: habitColor }: { months: (Rate & { month: Month })[]; color: string }) {
  const { t } = useTranslation();
  const color = useTheme().mark(habitColor);
  const height = 120;
  const lastKnown = months.map((m) => m.ratio !== null).lastIndexOf(true);
  const [selected, setSelected] = useState(lastKnown);

  return (
    <View className="gap-2">
      <View className="flex-row items-end gap-1.5" style={{ height: height + 18 }}>
        {months.map((m, i) => (
          <Pressable
            key={m.month}
            accessibilityRole="button"
            accessibilityLabel={t('stats.valueA11y', { label: monthYear(m.month, locale), value: ratioText(m, t) })}
            onPress={() => setSelected(i)}
            hitSlop={{ top: 8, bottom: 8 }}
            className="flex-1 items-center justify-end gap-1"
            style={{ height: height + 18 }}
          >
            {i === selected && m.ratio !== null && (
              <Text className="text-[11px] font-semibold tabular-nums">{percent(m.ratio, locale)}</Text>
            )}
            {m.ratio !== null && (
              <View
                className={cn('w-full max-w-6 rounded-t', m.ratio === 0 && 'bg-empty', i !== selected && 'opacity-75')}
                style={{ height: Math.max(3, Math.round(m.ratio * height)), backgroundColor: m.ratio > 0 ? color : undefined }}
              />
            )}
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-1.5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {months.map((m, i) => (
          <Text key={m.month} className={cn('flex-1 text-center text-[11px]', i === selected ? 'text-ink' : 'text-faint')}>
            {monthLetter(m.month, locale)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Horizontal bars with labels, e.g. one per weekday or per year. Values show
 * for the `emphasized` rows (the story: hardest and easiest day); tap any row to see its value.
 */
export function HBars({
  rows,
  color: habitColor,
  emphasized = [],
}: {
  rows: { label: string; a11yLabel?: string; rate: Rate }[];
  color: string;
  emphasized?: number[];
}) {
  const { t } = useTranslation();
  const color = useTheme().mark(habitColor);
  const [revealed, setRevealed] = useState<number | null>(null);

  return (
    <View className="gap-2.5">
      {rows.map((row, i) => {
        const strong = emphasized.includes(i);
        const showValue = strong || revealed === i;
        return (
          <Pressable
            key={row.label}
            accessibilityRole="button"
            accessibilityLabel={t('stats.valueA11y', { label: row.a11yLabel ?? row.label, value: ratioText(row.rate, t) })}
            onPress={() => setRevealed(revealed === i ? null : i)}
            className="min-h-[24px] flex-row items-center gap-3"
          >
            <Text className={cn('w-11 text-sm', strong ? 'font-semibold' : 'text-muted')}>{row.label}</Text>
            {/* The track is the "empty" color, the fill the habit's: the whole bar reads as one scale. */}
            <View className="h-2.5 flex-1 flex-row overflow-hidden rounded-full bg-empty">
              {row.rate.ratio !== null && row.rate.ratio > 0 && (
                <View className="h-2.5 rounded-full" style={{ width: `${row.rate.ratio * 100}%`, backgroundColor: color }} />
              )}
            </View>
            <Text className={cn('w-11 text-right text-sm tabular-nums', strong ? 'font-semibold' : 'text-muted')}>
              {showValue ? ratioText(row.rate, t) : ''}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The last 26 weeks, one column per week, with a legend for the cell states. */
export function CalendarGrid({
  weeks,
  color: habitColor,
  weekStartsOn,
}: {
  weeks: CalendarCell[][];
  color: string;
  weekStartsOn: WeekStart;
}) {
  const { t } = useTranslation();
  const color = useTheme().mark(habitColor);
  const [width, setWidth] = useState(0);
  const gap = 3;
  const cell = width > 0 ? Math.floor((width - gap * (weeks.length - 1)) / weeks.length) : 0;
  const counted = weeks.flat().filter((c) => c.state !== 'outside');

  // A month's label sits above the first week holding its 1st (and above the first column).
  const labels = weeks.map((week, i) => {
    const first = week.find((c) => c.day.endsWith('-01'));
    if (first) return monthShort(first.day.slice(0, 7), locale);
    return i === 0 ? monthShort(week[0].day.slice(0, 7), locale) : '';
  });

  return (
    <View className="gap-3">
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessible
        accessibilityLabel={t('stats.calendarA11y', {
          done: counted.filter((c) => c.state === 'done').length,
          total: counted.length,
        })}
      >
        {cell > 0 && (
          <>
            <View className="mb-1 h-4 flex-row" style={{ gap }}>
              {labels.map((label, i) => (
                // Labels may be wider than a column: they overflow to the right, over empty columns.
                <View key={i} style={{ width: cell }} className="overflow-visible">
                  <Text numberOfLines={1} className="w-12 text-[11px] text-faint">
                    {label}
                  </Text>
                </View>
              ))}
            </View>
            <View className="flex-row" style={{ gap }}>
              {weeks.map((week) => (
                <View key={week[0].day} style={{ gap }}>
                  {week.map((c) => (
                    <View
                      key={c.day}
                      accessibilityLabel={longDay(c.day, locale)}
                      className={cn(
                        'rounded-[3px]',
                        c.state === 'missed' && 'bg-empty',
                        c.isToday && c.state !== 'done' && 'border-[1.5px] border-ink',
                      )}
                      style={{
                        width: cell,
                        height: cell,
                        backgroundColor: c.state === 'done' ? color : undefined,
                      }}
                    />
                  ))}
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5">
        <LegendItem label={t('stats.legendDone')}>
          <View className="size-2.5 rounded-[3px]" style={{ backgroundColor: color }} />
        </LegendItem>
        <LegendItem label={t('stats.legendMissed')}>
          <View className="size-2.5 rounded-[3px] bg-empty" />
        </LegendItem>
        <Text className="ml-auto text-xs text-muted">{weekStartsOn === 'monday' ? t('stats.mondayOnTop') : t('stats.sundayOnTop')}</Text>
      </View>
    </View>
  );
}

function LegendItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {children}
      <Text className="text-xs text-muted">{label}</Text>
    </View>
  );
}
