import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type Props = {
  children: ReactNode;
  /** Scrollable content (stats, settings) vs. fixed layout (day screen, forms). */
  scroll?: boolean;
  /** Rendered above the content, outside the scroll view (e.g. a floating button). */
  overlay?: ReactNode;
};

/** Full-screen page with the app background, safe-area padding and the mockup's spacing. */
export function Screen({ children, scroll = false, overlay }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: insets.top + theme.space.screenTop,
    paddingBottom: insets.bottom + 24,
    paddingHorizontal: theme.space.screenX,
    gap: theme.space.gap,
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={padding}>{children}</ScrollView>
      ) : (
        <View style={[styles.fill, padding]}>{children}</View>
      )}
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
