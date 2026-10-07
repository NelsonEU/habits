import '@/global.css';
import '@/i18n';

import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { initDatabase } from '@/db/schema';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="habits.db" onInit={initDatabase}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="habits/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="habits/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </SQLiteProvider>
  );
}
