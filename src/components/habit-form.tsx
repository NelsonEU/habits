import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, TextInput, View } from 'react-native';

import { HABIT_COLORS } from '@/domain/palette';
import { cn } from '@/lib/cn';
import { useTheme } from '@/theme';
import { PrimaryButton } from './buttons';
import { HabitCard } from './habit-card';
import { Text } from './text';

export const MAX_NAME_LENGTH = 60;

type Props = {
  initial: { name: string; color: string };
  submitLabel: string;
  onSubmit: (habit: { name: string; color: string }) => void;
  /** New habits get the phrasing hint and focus the name field. */
  isNew?: boolean;
  /** Rendered between the form and the submit button (e.g. the archive section). */
  children?: ReactNode;
};

/** Name, color and preview of a habit: shared by "Nouvelle habitude" and "Modifier". */
export function HabitForm({ initial, submitLabel, onSubmit, isNew = false, children }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color);
  const [previewChecked, setPreviewChecked] = useState(false);
  const trimmed = name.trim();

  return (
    <>
      <View className="gap-2.5">
        <Text nativeID="habit-name-label" className="font-semibold">
          {t('habits.form.name')}
        </Text>
        <TextInput
          accessibilityLabelledBy="habit-name-label"
          value={name}
          onChangeText={setName}
          placeholder={t('habits.form.namePlaceholder')}
          placeholderTextColor={colors.placeholder}
          maxLength={MAX_NAME_LENGTH}
          autoFocus={isNew}
          autoCapitalize="sentences"
          returnKeyType="done"
          className="h-14 rounded-2xl border border-line-strong bg-surface px-4 font-sans text-lg text-ink"
        />
        {isNew && <Text className="text-[13px] leading-[19px] text-muted">{t('habits.form.nameHint')}</Text>}
      </View>

      <View className="gap-3">
        <Text className="font-semibold">{t('habits.form.color')}</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-3">
          {HABIT_COLORS.map((c) => {
            const selected = c.hex === color;
            return (
              <Pressable
                key={c.hex}
                accessibilityRole="radio"
                accessibilityLabel={t(`colors.${c.id}`)}
                accessibilityState={{ checked: selected }}
                onPress={() => setColor(c.hex)}
                className={cn('size-12 items-center justify-center rounded-full border-2', selected ? 'border-ink' : 'border-transparent')}
              >
                {/* The swatch itself is data (the color), so it's a style. The hairline keeps pale
                    swatches visible on the light theme's white. */}
                <View className="size-10 rounded-full border border-line" style={{ backgroundColor: c.hex }} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-3">
        <Text className="font-semibold">{t('habits.form.preview')}</Text>
        <HabitCard
          name={trimmed || t('habits.form.previewName')}
          color={color}
          checked={previewChecked}
          subtitle={t('habits.form.previewHint')}
          onToggle={() => setPreviewChecked((c) => !c)}
        />
      </View>

      {children}

      <View className="mt-auto">
        <PrimaryButton label={submitLabel} onPress={trimmed ? () => onSubmit({ name: trimmed, color }) : undefined} />
      </View>
    </>
  );
}
