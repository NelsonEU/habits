/**
 * Design tokens from the mockup. Only the dark theme exists for v1; a light
 * theme will be another object with the same keys (see Réglages mockup).
 */
export const dark = {
  colors: {
    background: '#12141C',
    surface: '#1B1E29',
    surfaceMuted: '#161821', // archived rows
    control: '#262A36', // small square buttons
    line: '#2A2E3B',
    lineStrong: '#3A3F4E',
    empty: '#343846', // "not done" dots and cells
    text: '#F2EFE8',
    textSoft: '#C9CBD4', // chart answer sentences
    muted: '#A3A6B4',
    faint: '#8C90A0',
    placeholder: '#7C8091',
    onAccent: '#12141C', // text on a ticked (colored) card
    switchOn: '#3E8A66',
  },
  fonts: {
    display: 'BricolageGrotesque_700Bold',
    regular: 'Figtree_400Regular',
    medium: 'Figtree_500Medium',
    semibold: 'Figtree_600SemiBold',
  },
  radius: { sm: 14, md: 20, lg: 24, pill: 999 },
  space: { screenX: 20, screenTop: 12, gap: 28 },
} as const;

export type Theme = typeof dark;
