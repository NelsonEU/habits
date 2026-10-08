/**
 * Design tokens from the mockup — the single source for both Tailwind classes
 * (tailwind.config.ts turns `lineStrong` into `border-line-strong`, etc.) and
 * the few props that can't take a class (icon tint colors).
 * Only the dark theme exists for v1.
 */
export const colors = {
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
  onAccent: '#12141C', // text on a ticked (colored) card
  switchOn: '#3E8A66',
  danger: '#F0776B', // destructive actions: archive, delete
} as const;

/** Font families embedded in the app (see app.json); weights come from font-medium, font-semibold… */
export const fonts = {
  sans: 'Figtree',
  display: 'Bricolage Grotesque',
} as const;
