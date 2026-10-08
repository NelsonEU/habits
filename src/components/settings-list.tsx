import { type SFSymbol, SymbolView } from 'expo-symbols';
import { Children, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { colors } from '@/theme';
import { Text } from './text';

/** A titled group of rows, as in the mockup's Réglages screen. */
export function SettingsSection({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View className="gap-2">
      {title && <Text className="ml-1 text-[13px] font-semibold text-muted">{title}</Text>}
      <View className="overflow-hidden rounded-[20px] border border-line bg-surface">
        {rows.map((row, i) => (
          <View key={i} className={cn(i > 0 && 'border-t border-line')}>
            {row}
          </View>
        ))}
      </View>
      {footer && <Text className="mx-1 text-[13px] leading-[19px] text-muted">{footer}</Text>}
    </View>
  );
}

/** One tappable row: icon, label, optional second line. Disabled when `onPress` is missing. */
export function SettingsRow({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: SFSymbol;
  label: string;
  detail?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={detail}
      accessibilityState={{ disabled: !onPress }}
      disabled={!onPress}
      onPress={onPress}
      className={cn('min-h-[60px] flex-row items-center gap-3 px-4 py-3 active:opacity-60', !onPress && 'opacity-50')}
    >
      <SymbolView name={icon} size={19} weight="medium" tintColor={colors.ink} />
      <View className="flex-1 gap-0.5">
        <Text className="text-[17px] font-semibold">{label}</Text>
        {detail && <Text className="text-[13px] text-muted">{detail}</Text>}
      </View>
    </Pressable>
  );
}
