import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Body } from './text';

/** Temporary box standing in for a screen's content until its step is built. */
export function Placeholder({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { borderColor: theme.colors.lineStrong }]}>
      <Body tone="faint" size={14}>
        {children}
      </Body>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: 16, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed' },
});
