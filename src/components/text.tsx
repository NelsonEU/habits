import { Text, type TextProps } from 'react-native';

import { useTheme } from '@/theme';

/** Screen title, in the display font ("Mes habitudes", "Aujourd’hui"…). */
export function Title({ style, ...props }: TextProps) {
  const theme = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontFamily: theme.fonts.display, fontSize: 38, letterSpacing: -0.76, color: theme.colors.text }, style]}
      {...props}
    />
  );
}

/** Body text. `tone` picks the color, `size` defaults to 15. */
export function Body({
  style,
  tone = 'text',
  size = 15,
  weight = 'regular',
  ...props
}: TextProps & {
  tone?: 'text' | 'muted' | 'faint';
  size?: number;
  weight?: 'regular' | 'medium' | 'semibold';
}) {
  const theme = useTheme();
  return (
    <Text
      style={[{ fontFamily: theme.fonts[weight], fontSize: size, lineHeight: size * 1.4, color: theme.colors[tone] }, style]}
      {...props}
    />
  );
}
