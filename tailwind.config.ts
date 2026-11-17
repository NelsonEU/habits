import type { Config } from 'tailwindcss';

import { fonts, tokenNames } from './src/theme/tokens';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // The theme comes from CSS variables (ThemeProvider), never `dark:` classes. 'class' only stops
  // NativeWind's web runtime from throwing over the default 'media' mode.
  darkMode: 'class',
  theme: {
    extend: {
      // Every color is a CSS variable set by ThemeProvider, so classes follow the theme.
      // <alpha-value> keeps opacity modifiers working (text-on-accent/70).
      colors: Object.fromEntries(tokenNames.map(({ css }) => [css, `rgb(var(--${css}) / <alpha-value>)`])),
      fontFamily: {
        sans: [fonts.sans],
        display: [fonts.display],
      },
    },
  },
} satisfies Config;
