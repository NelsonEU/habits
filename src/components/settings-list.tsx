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

/**
 * One row: icon, label, optional second line, and on the right a value ("Lundi") or a
 * control (a time picker). Tappable when `onPress` is given.
 */
export function SettingsRow({
  icon,
  label,
  detail,
  value,
  trailing,
  tone = 'default',
  onPress,
}: {
  icon: SFSymbol;
  label: string;
  detail?: string;
  value?: string;
  trailing?: ReactNode;
  tone?: 'default' | 'warning';
  onPress?: () => void;
}) {
  const content = (
    <>
      <SymbolView name={icon} size={19} weight="medium" tintColor={tone === 'warning' ? colors.danger : colors.ink} />
      <View className="flex-1 gap-0.5">
        <Text className={cn('text-[17px] font-semibold', tone === 'warning' && 'text-danger')}>{label}</Text>
        {detail && <Text className="text-[13px] text-muted">{detail}</Text>}
      </View>
      {value && <Text className="text-base text-muted">{value}</Text>}
      {trailing}
    </>
  );
  const className = 'min-h-[60px] flex-row items-center gap-3 px-4 py-3';

  if (!onPress) return <View className={className}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={detail}
      onPress={onPress}
      className={cn(className, 'active:opacity-60')}
    >
      {content}
    </Pressable>
  );
}
