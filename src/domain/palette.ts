/**
 * The 6 habit colors. Habits store the hex value; `id` names the color in translations.
 *
 * Tuned from the mockup's palette so every pair stays distinguishable side by side (week strip
 * dots, lists): OKLab ΔE ≥ 15 in normal vision and ≥ 8 under protan/deutan simulation, checked with
 * the dataviz palette validator. They stay light on purpose (above its dark-mode lightness band):
 * a ticked card shows dark text on the habit's color. Amber is the logo's moon and never changes.
 */
export const HABIT_COLORS = [
  { hex: '#E985A2', id: 'rose' },
  { hex: '#D3B8FF', id: 'lilac' },
  { hex: '#96A331', id: 'olive' },
  { hex: '#F0B35A', id: 'amber' },
  { hex: '#6E9BF2', id: 'blue' },
  { hex: '#80DAB5', id: 'mint' },
] as const;

/** The mockup's original colors, and what they became: for migration 4 and older export files. */
export const LEGACY_COLORS: Record<string, string> = {
  '#F08CA8': '#E985A2',
  '#B79CF5': '#D3B8FF',
  '#C9D86A': '#96A331',
  '#7FD9B4': '#80DAB5',
};

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
