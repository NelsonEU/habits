import { vars } from 'nativewind';
import { createContext, type ReactNode, useContext } from 'react';
import { useColorScheme, View } from 'react-native';

import type { ThemePreference } from '@/domain/model';
import { markColor } from '@/domain/palette';
import { cssVariables, fonts, type Scheme, type ThemeColors, themes } from './tokens';

export { fonts };
export type { Scheme, ThemeColors };

type Theme = {
  scheme: Scheme;
  colors: ThemeColors;
  /** A habit's color for small marks (dots, rings, bars), readable on this theme's surfaces. */
  mark: (habitColor: string) => string;
};

const make = (scheme: Scheme): Theme => ({
  scheme,
  colors: themes[scheme],
  mark: (hex) => markColor(hex, scheme),
});
const THEMES = { dark: make('dark'), light: make('light') };
const VARIABLES = { dark: vars(cssVariables('dark')), light: vars(cssVariables('light')) };

const ThemeContext = createContext<Theme>(THEMES.dark);

/** The current theme, for the few props that can't take a class (icon tints, native controls). */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/**
 * Applies the theme: sets the CSS variables every color class reads, and gives useTheme() its value.
 * "system" follows the iPhone's appearance.
 */
export function ThemeProvider({ preference, children }: { preference: ThemePreference; children: ReactNode }) {
  const system = useColorScheme();
  const scheme: Scheme = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;
  return (
    <ThemeContext.Provider value={THEMES[scheme]}>
      <View style={[{ flex: 1 }, VARIABLES[scheme]]}>{children}</View>
    </ThemeContext.Provider>
  );
}
