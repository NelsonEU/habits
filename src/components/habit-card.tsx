import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

type Props = {
  name: string;
  color: string;
  checked: boolean;
  subtitle: string;
  onToggle: () => void;
};

/** A habit to tick: the whole card fills with the habit's color once ticked. */
export function HabitCard({ name, color, checked, subtitle, onToggle }: Props) {
  const theme = useTheme();
  const ink = theme.colors.onAccent;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={name}
      accessibilityHint={subtitle}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: checked ? color : theme.colors.surface,
          borderColor: checked ? color : theme.colors.line,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.ring, { backgroundColor: checked ? ink : 'transparent', borderColor: checked ? ink : color }]}>
        {checked && <SymbolView name="checkmark" size={20} weight="bold" tintColor={color} />}
      </View>
      <View style={styles.text}>
        <Text style={[styles.name, { color: checked ? ink : theme.colors.text, fontFamily: theme.fonts.semibold }]}>
          {name}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: checked ? 'rgba(18,20,28,0.72)' : theme.colors.muted, fontFamily: theme.fonts.regular },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    minHeight: 92,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  ring: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, minWidth: 0, gap: 6 },
  name: { fontSize: 20, lineHeight: 24 },
  subtitle: { fontSize: 13 },
});
