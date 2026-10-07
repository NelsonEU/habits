import type { Config } from 'tailwindcss';

import { colors, fonts } from './src/theme/tokens';

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export default {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Object.fromEntries(Object.entries(colors).map(([name, value]) => [kebab(name), value])),
      fontFamily: {
        sans: [fonts.sans],
        display: [fonts.display],
      },
    },
  },
} satisfies Config;
