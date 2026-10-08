import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { BackLink, PillButton } from '@/components/buttons';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';
import { deleteHabit, restoreHabit } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import type { Habit } from '@/domain/model';

/** Archived habits: restore them, or swipe left to delete them for good. */
export default function ArchivedHabitsScreen() {
  const { t } = useTranslation();
  const archived = useSnapshot().habits.filter((h) => h.archivedAt !== null);

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('habits.title')} fallback="/habits" chevron />
        <Title>{t('habits.archivedTitle')}</Title>
        {archived.length > 0 && <Text className="text-sm leading-5 text-muted">{t('habits.archived.intro')}</Text>}
      </View>

      <View className="gap-2.5">
        {archived.map((h) => (
          <ArchivedRow key={h.id} habit={h} />
        ))}
        {archived.length === 0 && <Text className="text-muted">{t('habits.archived.empty')}</Text>}
      </View>
    </Screen>
  );
}

function ArchivedRow({ habit }: { habit: Habit }) {
  const { t } = useTranslation();
  const db = useSQLiteContext();

  const confirmDelete = (close: () => void) =>
    Alert.alert(t('habits.archived.deleteTitle', { name: habit.name }), t('habits.archived.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel', onPress: close },
      {
        text: t('habits.archived.delete'),
        style: 'destructive',
        onPress: () => {
          deleteHabit(db, habit.id);
          notifyChange();
        },
      },
    ]);

  return (
    <Swipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={(_progress, _drag, swipeable) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('habits.archived.deleteTitle', { name: habit.name })}
          onPress={() => confirmDelete(swipeable.close)}
          className="ml-2.5 w-24 items-center justify-center rounded-[20px] bg-danger active:opacity-70"
        >
          <Text className="font-semibold text-on-accent">{t('habits.archived.delete')}</Text>
        </Pressable>
      )}
    >
      <View className="min-h-[72px] flex-row items-center gap-3 rounded-[20px] border border-line bg-surface-muted py-2.5 pl-4 pr-2.5">
        <View className="size-3 rounded-full opacity-45" style={{ backgroundColor: habit.color }} />
        <Text numberOfLines={2} className="min-w-0 flex-1 text-[17px] font-semibold text-faint">
          {habit.name}
        </Text>
        <PillButton
          label={t('habits.archived.restore')}
          onPress={() => {
            restoreHabit(db, habit.id);
            notifyChange();
          }}
        />
      </View>
    </Swipeable>
  );
}
