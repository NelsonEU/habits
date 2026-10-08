import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { BackLink } from '@/components/buttons';
import { HabitForm } from '@/components/habit-form';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';
import { archiveHabit, updateHabit } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';

/** 1d · Modifier une habitude (modal). */
export default function EditHabitScreen() {
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const habit = useSnapshot().habits.find((h) => h.id === Number(id));

  // Deleted or unknown (e.g. an old link): nothing to edit.
  if (!habit) return null;

  const confirmArchive = () =>
    Alert.alert(t('habits.archive.confirmTitle', { name: habit.name }), t('habits.archive.confirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('habits.archive.confirm'),
        style: 'destructive',
        onPress: () => {
          archiveHabit(db, habit.id);
          notifyChange();
          router.back();
        },
      },
    ]);

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.cancel')} fallback="/habits" />
        <Title>{t('habits.editTitle')}</Title>
      </View>
      <HabitForm
        initial={{ name: habit.name, color: habit.color }}
        submitLabel={t('habits.form.save')}
        onSubmit={(changes) => {
          updateHabit(db, habit.id, changes);
          notifyChange();
          router.back();
        }}
      >
        {habit.archivedAt === null && (
          <View className="gap-2.5 rounded-[20px] border border-line bg-surface p-4">
            <Pressable accessibilityRole="button" onPress={confirmArchive} className="min-h-11 justify-center active:opacity-60">
              <Text className="text-[17px] font-semibold text-danger">{t('habits.archive.button')}</Text>
            </Pressable>
            <Text className="text-[13px] leading-[19px] text-muted">{t('habits.archive.hint')}</Text>
          </View>
        )}
      </HabitForm>
    </Screen>
  );
}
