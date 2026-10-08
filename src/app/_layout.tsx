import '@/global.css';
import '@/i18n';

import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { initDatabase } from '@/db/schema';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    // Needed by swipe gestures (swipe to delete in Archivées). A style, not a class: NativeWind
    // only converts className on React Native's own components.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="habits.db" onInit={initDatabase}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="habits/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="habits/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="import" options={{ presentation: 'modal' }} />
        </Stack>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
