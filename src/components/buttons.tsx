import { type Href, router } from 'expo-router';
import { Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';
import { useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { Text } from './text';

/** Round 44pt button with an SF Symbol, like the stats/settings buttons of the day screen. */
export function IconButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="size-11 items-center justify-center rounded-full border border-line bg-surface active:opacity-60"
    >
      <Icon name={icon} size={19} color={colors.ink} />
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
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      hitSlop={8}
      className={cn('min-h-11 flex-row items-center gap-1.5 active:opacity-60', align === 'left' ? 'self-start' : 'self-end')}
    >
      {chevron && <Icon name="back" size={17} color={strong ? colors.ink : colors.muted} />}
      <Text className={cn('text-base', strong ? 'font-semibold' : 'text-muted')}>{label}</Text>
    </Pressable>
  );
}

/** The round floating button at the bottom right of the day screen. */
export function Fab({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="absolute right-5 size-[60px] items-center justify-center rounded-full bg-ink shadow-lg shadow-black/50 active:scale-95"
      style={{ bottom: insets.bottom + 16 }}
    >
      <Icon name={icon} size={24} color={colors.onInk} />
    </Pressable>
  );
}

/** Outlined pill, e.g. "Aujourd’hui". Disabled when `onPress` is missing. */
export function PillButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className={cn(
        'min-h-10 items-center justify-center rounded-full border border-line-strong px-3.5 active:opacity-60',
        !onPress && 'opacity-60',
      )}
    >
      <Text className="text-sm">{label}</Text>
    </Pressable>
  );
}

/**
 * Outlined action with the same size as PrimaryButton, for the second choice of a pair.
 * `danger` for destructive actions. Disabled when `onPress` is missing.
 */
export function SecondaryButton({
  label,
  onPress,
  tone = 'default',
}: {
  label: string;
  onPress?: () => void;
  tone?: 'default' | 'danger';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className={cn(
        'min-h-14 items-center justify-center rounded-full border px-5 active:opacity-60',
        tone === 'danger' ? 'border-danger' : 'border-line-strong',
        !onPress && 'opacity-60',
      )}
    >
      <Text className={cn('text-[17px] font-semibold', tone === 'danger' && 'text-danger')}>{label}</Text>
    </Pressable>
  );
}

/** Full-width main action, light on dark. Disabled when `onPress` is missing. */
export function PrimaryButton({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className={cn(
        'min-h-14 items-center justify-center rounded-full bg-ink px-5 active:opacity-70',
        !onPress && 'opacity-70',
      )}
    >
      <Text className="text-[17px] font-semibold text-on-ink">{label}</Text>
    </Pressable>
  );
}
