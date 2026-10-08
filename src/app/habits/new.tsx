import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { HabitForm } from '@/components/habit-form';
import { Screen } from '@/components/screen';
import { Title } from '@/components/text';
import { createHabit } from '@/db/repo';
import { notifyChange } from '@/db/store';
import { HABIT_COLORS } from '@/domain/palette';
import { useToday } from '@/hooks/use-today';

/** 1c · Nouvelle habitude (modal). */
export default function NewHabitScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const today = useToday();

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.cancel')} fallback="/habits" />
        <Title>{t('habits.newTitle')}</Title>
      </View>
      <HabitForm
        isNew
        initial={{ name: '', color: HABIT_COLORS[0].hex }}
        submitLabel={t('habits.form.add')}
        onSubmit={(habit) => {
          createHabit(db, habit, today);
          notifyChange();
          router.back();
        }}
      />
    </Screen>
  );
}
