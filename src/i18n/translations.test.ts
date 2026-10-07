import en from './locales/en.json';
import fr from './locales/fr.json';

/*
 * Keeps the translation files in sync: every language must have exactly the
 * English keys, and use the same {{placeholders}} in each string. Runs in CI.
 */
type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else flatten(value, path).forEach((v, k) => out.set(k, v));
  }
  return out;
}

const placeholders = (s: string) => [...s.matchAll(/{{\s*(\w+)\s*}}/g)].map((m) => m[1]).sort();

const reference = flatten(en);

describe.each([['fr', fr]])('%s', (_, translations) => {
  const strings = flatten(translations);

  test('has every English key', () => {
    expect([...reference.keys()].filter((k) => !strings.has(k))).toEqual([]);
  });

  test('has no key missing from English', () => {
    expect([...strings.keys()].filter((k) => !reference.has(k))).toEqual([]);
  });

  test('uses the same placeholders', () => {
    const mismatches = [...reference].filter(
      ([key, value]) => strings.has(key) && placeholders(value).join() !== placeholders(strings.get(key)!).join(),
    );
    expect(mismatches.map(([key]) => key)).toEqual([]);
  });

  test('has no empty string', () => {
    expect([...strings].filter(([, v]) => v.trim() === '').map(([k]) => k)).toEqual([]);
  });
});
