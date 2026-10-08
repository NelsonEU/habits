import { Link, router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Sortable from 'react-native-sortables';

import { BackLink } from '@/components/buttons';
import { Screen } from '@/components/screen';
import { Text, Title } from '@/components/text';
import { setOrder } from '@/db/repo';
import { notifyChange, useSnapshot } from '@/db/store';
import type { Habit } from '@/domain/model';
import { moveInOrder } from '@/domain/order';
import { useTheme } from '@/theme';

/** 1b · Mes habitudes — drag the handle to reorder, tap a habit to edit it. */
export default function HabitsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const snapshot = useSnapshot();
  const active = snapshot.habits.filter((h) => h.archivedAt === null);
  const archivedCount = snapshot.habits.length - active.length;

  const saveOrder = (ids: number[]) => {
    setOrder(db, ids);
    notifyChange();
  };

  return (
    <Screen scroll>
      <View className="gap-3">
        <BackLink label={t('common.done')} fallback="/" align="right" strong />
        <Title>{t('habits.title')}</Title>
        <Text className="text-sm leading-5 text-muted">{t('habits.intro')}</Text>
      </View>

      <View className="gap-2.5">
        <Sortable.Grid
          data={active}
          keyExtractor={(h) => String(h.id)}
          columns={1}
          rowGap={10}
          customHandle
          hapticsEnabled
          overDrag="vertical"
          activeItemScale={1.03}
          dragActivationDelay={0}
          // The list is short and sits near the top: no need to scroll while dragging.
          autoScrollEnabled={false}
          onDragEnd={({ data }) => saveOrder(data.map((h) => h.id))}
          renderItem={({ item }) => (
            <HabitRow
              habit={item}
              // VoiceOver can't drag: it gets "move up / move down" actions instead.
              onMove={(step) => saveOrder(moveInOrder(active.map((h) => h.id), item.id, step))}
            />
          )}
        />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/habits/new')}
          className="min-h-14 flex-row items-center justify-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-line-strong active:opacity-60"
        >
          <SymbolView name="plus" size={16} weight="semibold" tintColor={colors.muted} />
          <Text className="text-base text-muted">{t('habits.new')}</Text>
        </Pressable>
      </View>

      {archivedCount > 0 && (
        <Link href="/habits/archived" asChild>
          <Pressable accessibilityRole="link" className="mt-auto min-h-11 justify-center self-start active:opacity-60">
            <Text className="text-muted">{t('habits.archivedLink', { count: archivedCount })}</Text>
          </Pressable>
        </Link>
      )}
    </Screen>
  );
}

function HabitRow({ habit, onMove }: { habit: Habit; onMove: (step: -1 | 1) => void }) {
  const { t } = useTranslation();
  const { colors, mark } = useTheme();

  return (
    <View className="min-h-[72px] flex-row items-center rounded-[20px] border border-line bg-surface pr-1">
      {/*
        The tap zone and the drag handle are siblings, never nested: when the tap zone wrapped the
        handle, the two gestures competed (taps lost, or drags swallowed).
      */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={habit.name}
        accessibilityHint={t('habits.editHint')}
        accessibilityActions={[
          { name: 'moveUp', label: t('habits.moveUp', { name: habit.name }) },
          { name: 'moveDown', label: t('habits.moveDown', { name: habit.name }) },
        ]}
        onAccessibilityAction={(e) => onMove(e.nativeEvent.actionName === 'moveUp' ? -1 : 1)}
        onPress={() => router.push(`/habits/${habit.id}`)}
        className="flex-1 flex-row items-center gap-3 self-stretch py-2.5 pl-4 active:opacity-60"
      >
        <View className="size-3 rounded-full" style={{ backgroundColor: mark(habit.color) }} />
        <Text numberOfLines={2} className="min-w-0 flex-1 text-[17px] font-semibold">
          {habit.name}
        </Text>
      </Pressable>
      <Sortable.Handle>
        <View className="size-11 items-center justify-center">
          <SymbolView name="line.3.horizontal" size={18} weight="semibold" tintColor={colors.faint} />
        </View>
      </Sortable.Handle>
    </View>
  );
}
