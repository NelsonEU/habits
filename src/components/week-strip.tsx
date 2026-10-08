import { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { addDays, type Day } from '@/domain/day';
import type { Dot } from '@/domain/day-view';
import { locale } from '@/i18n';
import { longDay, weekdayLetter, weekLabel } from '@/i18n/format';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme';
import { Icon } from './icon';
import { Text } from './text';

/** Month label with week arrows. Kept separate so the header row can put buttons beside it. */
export function WeekNav({
  weekStart,
  onPrev,
  onNext,
}: {
  weekStart: Day;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}) {
  const { t } = useTranslation();
  return (
    <View className="min-w-0 flex-1 flex-row items-center">
      <Arrow icon="back" label={t('day.previousWeek')} onPress={onPrev} />
      <Text numberOfLines={1} className="shrink text-center font-semibold">
        {weekLabel(weekStart, addDays(weekStart, 6), locale)}
      </Text>
      <Arrow icon="forward" label={t('day.nextWeek')} onPress={onNext} />
    </View>
  );
}

function Arrow({ icon, label, onPress }: { icon: 'back' | 'forward'; label: string; onPress: (() => void) | null }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress ?? undefined}
      className={cn('size-11 items-center justify-center active:opacity-60', !onPress && 'opacity-30')}
    >
      <Icon name={icon} size={18} color={colors.ink} />
    </Pressable>
  );
}

/** Seven days with one dot per habit, ticked or not. */
export function WeekDays({
  weekStart,
  today,
  selected,
  dotsFor,
  onSelect,
}: {
  weekStart: Day;
  today: Day;
  selected: Day;
  dotsFor: (day: Day) => Dot[];
  onSelect: (day: Day) => void;
}) {
  const { mark } = useTheme();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View className="flex-row gap-1">
      {days.map((day) => {
        const future = day > today;
        const isSelected = day === selected;
        return (
          <Pressable
            key={day}
            accessibilityRole="button"
            accessibilityLabel={longDay(day, locale)}
            accessibilityState={{ selected: isSelected, disabled: future }}
            disabled={future}
            onPress={() => onSelect(day)}
            className={cn(
              'flex-1 items-center gap-1.5 rounded-2xl border-[1.5px] border-transparent pb-2.5 pt-2',
              isSelected && 'border-ink bg-line',
              future && 'opacity-35',
            )}
          >
            <Text className="text-xs text-muted">{weekdayLetter(day, locale)}</Text>
            <Text className={cn('text-lg tabular-nums', day === today ? 'font-semibold' : 'font-medium')}>
              {Number(day.slice(8))}
            </Text>
            <View className="h-1.5 flex-row gap-[3px]">
              {dotsFor(day).map((dot, i) => (
                <View
                  key={i}
                  className={cn(
                    'size-1.5 rounded-full',
                    dot.state === 'missed' && 'bg-empty',
                  )}
                  // The habit's own color can't be a class: it's data.
                  style={dot.state === 'done' ? { backgroundColor: mark(dot.color) } : undefined}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The week strip as a carousel: it follows the finger and snaps to the
 * previous or next week, from the earliest habit's week to the current one.
 * `weekStart` stays the source of truth: the arrows and "Today" move it, and
 * the carousel scrolls to match; a swipe reports the new week via onWeekChange.
 */
export function WeekPager({
  first,
  last,
  weekStart,
  onWeekChange,
  ...days
}: {
  first: Day;
  last: Day;
  weekStart: Day;
  onWeekChange: (weekStart: Day) => void;
  today: Day;
  selected: Day;
  dotsFor: (day: Day) => Dot[];
  onSelect: (day: Day) => void;
}) {
  const [width, setWidth] = useState(0);
  const list = useRef<FlatList<Day>>(null);
  // iOS also reports the end of scrolls made by code: only a finger's swipe may change the week.
  const dragging = useRef(false);
  const weeks: Day[] = [];
  for (let w = first; w <= last; w = addDays(w, 7)) weeks.push(w);
  const index = Math.max(0, weeks.indexOf(weekStart));

  // Follow weekStart when it changes from outside (arrows, "Today", midnight).
  useEffect(() => {
    if (width > 0) list.current?.scrollToOffset({ offset: index * width, animated: true });
  }, [index, width]);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          ref={list}
          data={weeks}
          keyExtractor={(w) => w}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          // initialScrollIndex, not contentOffset: the list only draws items near the position it
          // knows about, so with contentOffset it drew the first week, off-screen.
          initialScrollIndex={index}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          // Only the visible week and its neighbors are drawn.
          initialNumToRender={1}
          windowSize={3}
          onScrollBeginDrag={() => {
            dragging.current = true;
          }}
          onMomentumScrollEnd={(e) => {
            if (!dragging.current) return;
            dragging.current = false;
            const week = weeks[Math.round(e.nativeEvent.contentOffset.x / width)];
            if (week && week !== weekStart) onWeekChange(week);
          }}
          renderItem={({ item }) => (
            <View style={{ width }}>
              <WeekDays weekStart={item} {...days} />
            </View>
          )}
        />
      )}
    </View>
  );
}
