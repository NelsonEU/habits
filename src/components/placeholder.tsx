import { View } from 'react-native';

import { Text } from './text';

/** Temporary box standing in for a screen's content until its step is built. */
export function Placeholder({ children }: { children: string }) {
  return (
    <View className="rounded-[20px] border-[1.5px] border-dashed border-line-strong p-4">
      <Text className="text-sm text-faint">{children}</Text>
    </View>
  );
}
