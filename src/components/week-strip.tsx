import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { addDays, type Day } from '@/domain/day';
import type { Dot } from '@/domain/day-view';
import { longDay, weekdayLetter, weekLabel } from '@/domain/format';
import { useTheme } from '@/theme';

type Props = {
  weekStart: Day;
  today: Day;
  selected: Day;
  dotsFor: (day: Day) => Dot[];
  onSelect: (day: Day) => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
};

/** Month label with week arrows. Kept separate so the header row can put buttons beside it. */
export function WeekNav({ weekStart, onPrev, onNext }: Pick<Props, 'weekStart' | 'onPrev' | 'onNext'>) {
  const theme = useTheme();
  return (
    <View style={styles.nav}>
      <Arrow icon="chevron.left" label="Semaine précédente" onPress={onPrev} />
      <Text numberOfLines={1} style={[styles.month, { color: theme.colors.text, fontFamily: theme.fonts.semibold }]}>
        {weekLabel(weekStart, addDays(weekStart, 6))}
      </Text>
      <Arrow icon="chevron.right" label="Semaine suivante" onPress={onNext} />
    </View>
  );
}

function Arrow({ icon, label, onPress }: { icon: 'chevron.left' | 'chevron.right'; label: string; onPress: (() => void) | null }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress ?? undefined}
      style={({ pressed }) => [styles.arrow, { opacity: !onPress ? 0.3 : pressed ? 0.6 : 1 }]}
    >
      <SymbolView name={icon} size={18} weight="semibold" tintColor={theme.colors.text} />
    </Pressable>
  );
}

/** Seven days with one dot per habit, to spot a forgotten day at a glance. */
export function WeekDays({ weekStart, today, selected, dotsFor, onSelect }: Omit<Props, 'onPrev' | 'onNext'>) {
  const theme = useTheme();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={styles.days}>
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
            style={[
              styles.day,
              {
                backgroundColor: isSelected ? theme.colors.line : 'transparent',
                borderColor: isSelected ? theme.colors.text : 'transparent',
                opacity: future ? 0.35 : 1,
              },
            ]}
          >
            <Text style={[styles.letter, { color: theme.colors.muted, fontFamily: theme.fonts.regular }]}>
              {weekdayLetter(day)}
            </Text>
            <Text
              style={[
                styles.num,
                { color: theme.colors.text, fontFamily: day === today ? theme.fonts.semibold : theme.fonts.medium },
              ]}
            >
              {Number(day.slice(8))}
            </Text>
            <View style={styles.dots}>
              {dotsFor(day).map((dot, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    dot.state === 'done' && { backgroundColor: dot.color },
                    dot.state === 'missed' && { backgroundColor: theme.colors.empty },
                    dot.state === 'forgotten' && { borderWidth: 1, borderColor: theme.colors.faint },
                  ]}
                />
              ))}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  month: { fontSize: 15, flexShrink: 1, textAlign: 'center' },
  days: { flexDirection: 'row', gap: 4 },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 10,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  letter: { fontSize: 12 },
  num: { fontSize: 18, fontVariant: ['tabular-nums'] },
  dots: { flexDirection: 'row', gap: 3, height: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
