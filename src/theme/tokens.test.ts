import { HABIT_COLORS, markColor } from '@/domain/palette';
import { cssVariables, themes } from './tokens';

// WCAG contrast ratio between two "#RRGGBB" colors.
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each(['dark', 'light'] as const)('%s theme', (scheme) => {
  const c = themes[scheme];

  test('text stays readable (4.5:1) on the background and on cards', () => {
    for (const text of [c.ink, c.soft, c.muted, c.faint]) {
      for (const surface of [c.background, c.surface]) expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('text on filled buttons and ticked cards stays readable', () => {
    expect(contrast(c.onInk, c.ink)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(c.onDanger, c.danger)).toBeGreaterThanOrEqual(4.5);
    for (const { hex } of HABIT_COLORS) expect(contrast(c.onAccent, hex)).toBeGreaterThanOrEqual(4.5);
  });

  test('habit marks stand out (3:1) from the background and cards', () => {
    for (const { hex } of HABIT_COLORS) {
      for (const surface of [c.background, c.surface]) expect(contrast(markColor(hex, scheme), surface)).toBeGreaterThanOrEqual(3);
    }
  });

  test('defines every variable as "r g b"', () => {
    const variables = cssVariables(scheme);
    expect(Object.keys(variables)).toEqual(Object.keys(cssVariables('dark')));
    for (const value of Object.values(variables)) expect(value).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
  });
});
