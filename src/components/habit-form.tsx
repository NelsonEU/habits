import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, TextInput, View } from 'react-native';

import { HABIT_COLORS } from '@/domain/palette';
import { freeHour } from '@/domain/reminders';
import { cn } from '@/lib/cn';
import { notificationPermission, type Permission, requestNotificationPermission } from '@/reminders/notifications';
import { useTheme } from '@/theme';
import { PillButton, PrimaryButton } from './buttons';
import { HabitCard } from './habit-card';
import { Icon } from './icon';
import { SettingsRow, SettingsSection } from './settings-list';
import { Text } from './text';
import { TimeField } from './time-field';

export const MAX_NAME_LENGTH = 60;

/** Ideas offered while a new habit's name is empty: a tap fills in the name and a color. */
const SUGGESTIONS = [
  { key: 'read', color: 'amber' },
  { key: 'walk', color: 'mint' },
  { key: 'water', color: 'blue' },
  { key: 'screens', color: 'lilac' },
  { key: 'stretch', color: 'rose' },
  { key: 'floss', color: 'olive' },
] as const;

const hexOf = (id: (typeof HABIT_COLORS)[number]['id']) => HABIT_COLORS.find((c) => c.id === id)!.hex;

export type HabitFormValues = { name: string; color: string; reminders: string[] };

type Props = {
  initial: HabitFormValues;
  submitLabel: string;
  onSubmit: (habit: HabitFormValues) => void;
  /** New habits get the phrasing hint and focus the name field. */
  isNew?: boolean;
  /** Rendered between the form and the submit button (e.g. the archive section). */
  children?: ReactNode;
};

/** Name, color, reminders and preview of a habit: shared by "Nouvelle habitude" and "Modifier". */
export function HabitForm({ initial, submitLabel, onSubmit, isNew = false, children }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [name, setName] = useState(initial.name);
  const [color, setColor] = useState(initial.color);
  // Times ("HH:MM"), saved with the rest of the form: a new habit has no id to attach them to yet.
  const [reminders, setReminders] = useState(initial.reminders);
  const [previewChecked, setPreviewChecked] = useState(false);
  const trimmed = name.trim();

  const [permission, setPermission] = useState<Permission | null>(null);
  useEffect(() => {
    notificationPermission().then(setPermission);
  }, []);

  const addReminder = async () => {
    setReminders((times) => [...times, freeHour(times, 9)]);
    // In context: the first reminder is when the permission makes sense.
    if (permission === 'undetermined') setPermission(await requestNotificationPermission());
  };

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

      {isNew && !name && (
        <View className="gap-3">
          <Text className="font-semibold">{t('habits.form.suggestionsTitle')}</Text>
          <View className="flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <PillButton
                key={s.key}
                label={t(`habits.suggestions.${s.key}`)}
                onPress={() => {
                  setName(t(`habits.suggestions.${s.key}`));
                  setColor(hexOf(s.color));
                }}
              />
            ))}
          </View>
        </View>
      )}

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
        <Text className="font-semibold">{t('habits.form.reminders')}</Text>
        <SettingsSection footer={reminders.length > 0 ? t('habits.form.remindersHint') : undefined}>
          {permission === 'denied' && reminders.length > 0 && (
            <SettingsRow
              icon="remindersOff"
              tone="warning"
              label={t('settings.notificationsDenied')}
              detail={t('settings.notificationsDeniedHint')}
              onPress={() => Linking.openSettings()}
            />
          )}
          {reminders.map((time, index) => (
            <SettingsRow
              // Times can repeat while being edited, so the position is the stable key.
              key={index}
              icon="reminder"
              label={t('settings.reminder')}
              trailing={
                <View className="flex-row items-center gap-1">
                  <TimeField
                    value={time}
                    onChange={(changed) => setReminders((times) => times.map((current, i) => (i === index ? changed : current)))}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('settings.removeReminder', { time })}
                    hitSlop={8}
                    onPress={() => setReminders((times) => times.filter((_, i) => i !== index))}
                    className="size-11 items-center justify-center active:opacity-60"
                  >
                    <Icon name="remove" size={20} weight="medium" color={colors.muted} />
                  </Pressable>
                </View>
              }
            />
          ))}
          <SettingsRow icon="add" label={t('settings.addReminder')} onPress={addReminder} />
        </SettingsSection>
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
        <PrimaryButton
          label={submitLabel}
          onPress={trimmed ? () => onSubmit({ name: trimmed, color, reminders: [...new Set(reminders)].sort() }) : undefined}
        />
      </View>
    </>
  );
}
