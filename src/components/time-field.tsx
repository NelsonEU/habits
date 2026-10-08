import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Pressable } from 'react-native';

import { fromTime, toTime } from '@/domain/reminders';
import { locale } from '@/i18n';
import { Text } from './text';

// 24-hour clock unless the locale uses AM/PM (en-US does, fr-FR doesn't).
const is24Hour = !/h1[12]/.test(new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle ?? '');

/**
 * A reminder time ("HH:MM"). Android has no inline time picker: the time shows as a button that
 * opens the system's time dialog. (iOS uses time-field.ios.tsx.)
 */
export function TimeField({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const date = fromTime(value);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          is24Hour,
          onValueChange: (_, picked) => onChange(toTime(picked)),
        })
      }
      className="min-h-11 justify-center rounded-[10px] bg-control px-3 active:opacity-60"
    >
      <Text className="text-base tabular-nums">{date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</Text>
    </Pressable>
  );
}
