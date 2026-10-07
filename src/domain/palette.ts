/** The 6 habit colors from the mockup. Habits store the hex value. */
export const HABIT_COLORS = [
  { hex: '#F08CA8', label: 'Rose' },
  { hex: '#B79CF5', label: 'Lilas' },
  { hex: '#C9D86A', label: 'Anis' },
  { hex: '#F0B35A', label: 'Ambre' },
  { hex: '#6E9BF2', label: 'Bleu' },
  { hex: '#7FD9B4', label: 'Menthe' },
] as const;

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
