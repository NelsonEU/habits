import DateTimePicker from '@react-native-community/datetimepicker';

import { fromTime, toTime } from '@/domain/reminders';
import { locale } from '@/i18n';
import { useTheme } from '@/theme';

/** A reminder time ("HH:MM"), as iOS's compact time picker: a small button that opens a popover. */
export function TimeField({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const { colors, scheme } = useTheme();
  return (
    <DateTimePicker
      value={fromTime(value)}
      mode="time"
      display="compact"
      themeVariant={scheme}
      locale={locale}
      accentColor={colors.ink}
      onValueChange={(_, date) => onChange(toTime(date))}
    />
  );
}
