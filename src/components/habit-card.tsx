import { SymbolView } from 'expo-symbols';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { Text } from './text';

type Props = {
  name: string;
  color: string;
  checked: boolean;
  subtitle: string;
  onToggle: () => void;
};

/** A habit to tick: the whole card fills with the habit's color once ticked. */
export function HabitCard({ name, color, checked, subtitle, onToggle }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={name}
      accessibilityHint={subtitle}
      onPress={onToggle}
      className={cn(
        'min-h-[92px] flex-row items-center gap-[18px] rounded-3xl border px-5 py-[18px] active:scale-[0.98]',
        !checked && 'border-line bg-surface',
      )}
      // The habit's own color can't be a class: it's data.
      style={checked ? { backgroundColor: color, borderColor: color } : undefined}
    >
      <View
        className={cn(
          'size-[46px] items-center justify-center rounded-full border-[2.5px]',
          checked && 'border-on-accent bg-on-accent',
        )}
        style={checked ? undefined : { borderColor: color }}
      >
        {checked && <SymbolView name="checkmark" size={20} weight="bold" tintColor={color} />}
      </View>
      <View className="min-w-0 flex-1 gap-1.5">
        <Text className={cn('text-xl font-semibold leading-6', checked && 'text-on-accent')}>{name}</Text>
        <Text className={cn('text-[13px] leading-[18px]', checked ? 'text-on-accent/70' : 'text-muted')}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}
