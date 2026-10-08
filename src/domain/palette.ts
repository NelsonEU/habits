/**
 * The 6 habit colors. Habits store the hex value; `id` names the color in translations.
 *
 * Tuned from the mockup's palette so every pair stays distinguishable side by side (week strip
 * dots, lists): OKLab ΔE ≥ 15 in normal vision and ≥ 8 under protan/deutan simulation, checked with
 * the dataviz palette validator. They stay light on purpose (above its dark-mode lightness band):
 * a ticked card shows dark text on the habit's color. Amber is the logo's moon and never changes.
 */
export const HABIT_COLORS = [
  { hex: '#E985A2', id: 'rose', lightMark: '#A3516A' },
  { hex: '#D3B8FF', id: 'lilac', lightMark: '#9B81C4' },
  { hex: '#96A331', id: 'olive', lightMark: '#636C13' },
  { hex: '#F0B35A', id: 'amber', lightMark: '#BB811F' },
  { hex: '#6E9BF2', id: 'blue', lightMark: '#376AD0' },
  { hex: '#80DAB5', id: 'mint', lightMark: '#429D7B' },
] as const;

/**
 * The color to draw a habit's small marks with (dots, rings, bars, calendar cells). In the light
 * theme the base colors are too pale on white, so marks use `lightMark`: same hue, darker, ≥ 3:1 on
 * both light surfaces, and still distinguishable pair by pair (validated like the base palette).
 * Fills under dark text (a ticked card) keep the base color in both themes.
 */
export function markColor(hex: string, scheme: 'light' | 'dark'): string {
  if (scheme === 'dark') return hex;
  return HABIT_COLORS.find((c) => c.hex === hex)?.lightMark ?? hex;
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** The palette color closest to any "#RRGGBB" color. */
export function nearestHabitColor(hex: string): string {
  const [r, g, b] = rgb(hex);
  let best: string = HABIT_COLORS[0].hex;
  let bestDistance = Infinity;
  for (const { hex: candidate } of HABIT_COLORS) {
    const [r2, g2, b2] = rgb(candidate);
    const distance = (r - r2) ** 2 + (g - g2) ** 2 + (b - b2) ** 2;
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
