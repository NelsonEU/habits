import { dark, type Theme } from './tokens';

export type { Theme };

/** The active theme. Always dark for v1; will follow the Thème setting later. */
export function useTheme(): Theme {
  return dark;
}
