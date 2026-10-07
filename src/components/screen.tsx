import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  /** Scrollable content (stats, settings) vs. fixed layout (forms). */
  scroll?: boolean;
  /** Rendered above the content, outside the scroll view (e.g. a floating button). */
  overlay?: ReactNode;
};

/** Full-screen page with the app background, safe-area padding and the mockup's spacing. */
export function Screen({ children, scroll = false, overlay }: Props) {
  const insets = useSafeAreaInsets();
  // Safe-area insets depend on the device, so they can't be classes.
  const safeArea = { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 };

  return (
    <View className="flex-1 bg-background">
      {scroll ? (
        // grow lets content push a footer to the bottom with mt-auto when it's short.
        <ScrollView contentContainerClassName="grow gap-7 px-5" contentContainerStyle={safeArea}>
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1 gap-7 px-5" style={safeArea}>
          {children}
        </View>
      )}
      {overlay}
    </View>
  );
}
