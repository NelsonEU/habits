import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

import { addDays, type Day } from '@/domain/day';
import type { Dot } from '@/domain/day-view';
import { longDay, weekdayLetter, weekLabel } from '@/domain/format';
import { cn } from '@/lib/cn';
import { colors } from '@/theme';
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
  return (
    <View className="min-w-0 flex-1 flex-row items-center">
      <Arrow icon="chevron.left" label="Semaine précédente" onPress={onPrev} />
      <Text numberOfLines={1} className="shrink text-center font-semibold">
        {weekLabel(weekStart, addDays(weekStart, 6))}
      </Text>
      <Arrow icon="chevron.right" label="Semaine suivante" onPress={onNext} />
    </View>
  );
}

function Arrow({ icon, label, onPress }: { icon: 'chevron.left' | 'chevron.right'; label: string; onPress: (() => void) | null }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress ?? undefined}
      className={cn('size-11 items-center justify-center active:opacity-60', !onPress && 'opacity-30')}
    >
      <SymbolView name={icon} size={18} weight="semibold" tintColor={colors.ink} />
    </Pressable>
  );
}

/** Seven days with one dot per habit, to spot a forgotten day at a glance. */
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
            accessibilityLabel={longDay(day)}
            accessibilityState={{ selected: isSelected, disabled: future }}
            disabled={future}
            onPress={() => onSelect(day)}
            className={cn(
              'flex-1 items-center gap-1.5 rounded-2xl border-[1.5px] border-transparent pb-2.5 pt-2',
              isSelected && 'border-ink bg-line',
              future && 'opacity-35',
            )}
          >
            <Text className="text-xs text-muted">{weekdayLetter(day)}</Text>
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
                    dot.state === 'forgotten' && 'border border-faint',
                  )}
                  // The habit's own color can't be a class: it's data.
                  style={dot.state === 'done' ? { backgroundColor: dot.color } : undefined}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
