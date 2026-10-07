import { type Href, router } from 'expo-router';
import { type SFSymbol, SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Body } from './text';

/** Round 44pt button with an SF Symbol, like the stats/settings buttons of the day screen. */
export function IconButton({ icon, label, onPress }: { icon: SFSymbol; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.icon,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.line, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <SymbolView name={icon} size={19} weight="semibold" tintColor={theme.colors.text} />
    </Pressable>
  );
}

/**
 * Text link at the top of a screen ("‹ Statistiques", "Annuler", "Terminé").
 * Goes back when there is a screen to go back to, otherwise to `fallback`
 * (e.g. when the app was opened directly on this screen).
 */
export function BackLink({
  label,
  fallback,
  chevron = false,
  align = 'left',
  strong = false,
}: {
  label: string;
  fallback: Href;
  chevron?: boolean;
  align?: 'left' | 'right';
  strong?: boolean;
}) {
  const theme = useTheme();
  const color = strong ? theme.colors.text : theme.colors.muted;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      hitSlop={8}
      style={({ pressed }) => [styles.back, { alignSelf: align === 'left' ? 'flex-start' : 'flex-end', opacity: pressed ? 0.6 : 1 }]}
    >
      {chevron && <SymbolView name="chevron.left" size={17} weight="semibold" tintColor={color} />}
      <Body size={16} weight={strong ? 'semibold' : 'regular'} style={{ color }}>
        {label}
      </Body>
    </Pressable>
  );
}

/** The round floating button at the bottom right of the day screen. */
export function Fab({ icon, label, onPress }: { icon: SFSymbol; label: string; onPress: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { bottom: insets.bottom + 16, backgroundColor: theme.colors.text, transform: [{ scale: pressed ? 0.95 : 1 }] },
      ]}
    >
      <SymbolView name={icon} size={24} weight="semibold" tintColor={theme.colors.onAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
  },
});
