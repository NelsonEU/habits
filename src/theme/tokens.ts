/**
 * Design tokens, one set per theme, with the same keys. Tailwind classes read them through CSS
 * variables (tailwind.config.ts: `bg-surface` is `rgb(var(--surface))`), set by ThemeProvider;
 * props that can't take a class (icon tints) read them through useTheme().
 *
 * Dark comes from the mockup; light extends the mockup's light Réglages screen.
 */
const dark = {
  background: '#12141C',
  surface: '#1B1E29',
  surfaceMuted: '#161821', // archived rows
  control: '#262A36', // small square buttons
  line: '#2A2E3B',
  lineStrong: '#3A3F4E',
  empty: '#343846', // "not done" dots and cells
  ink: '#F2EFE8', // main text
  soft: '#C9CBD4', // chart answer sentences
  muted: '#A3A6B4',
  faint: '#8C90A0',
  placeholder: '#7C8091',
  onAccent: '#12141C', // text on a habit's color (a ticked card): habit colors are light in both themes
  onInk: '#12141C', // text on an ink-filled button
  onDanger: '#12141C', // text on a danger-filled button
  switchOn: '#3E8A66',
  danger: '#F0776B', // destructive actions: archive, delete
};

export type ThemeColors = typeof dark;

const light: ThemeColors = {
  background: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#EFECE5',
  control: '#ECE9E1',
  line: '#E4E1D8',
  lineStrong: '#D2CEC3',
  empty: '#DEDAD0',
  ink: '#1A1C24',
  soft: '#3A3D48',
  muted: '#5E6270',
  faint: '#6B6F7D',
  placeholder: '#858999',
  onAccent: '#12141C',
  onInk: '#FFFFFF',
  onDanger: '#FFFFFF',
  switchOn: '#3E8A66',
  danger: '#C43D30',
};

export const themes = { dark, light } as const;

export type Scheme = keyof typeof themes;

/** Font families embedded in the app (see app.json); weights come from font-medium, font-semibold… */
export const fonts = {
  sans: 'Figtree',
  display: 'Bricolage Grotesque',
} as const;

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');

/** Token names as CSS variable names: lineStrong → --line-strong. */
export const tokenNames = Object.keys(dark).map((name) => ({ name, css: kebab(name) }));

/** A theme's CSS variables ("--line-strong": "58 63 78"), for NativeWind's vars(). */
export function cssVariables(scheme: Scheme): Record<string, string> {
  return Object.fromEntries(
    tokenNames.map(({ name, css }) => [`--${css}`, channels(themes[scheme][name as keyof ThemeColors])]),
  );
}
