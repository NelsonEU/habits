import { Asset } from 'expo-asset';

/*
 * Web only (`npm run web`): native builds embed the fonts at build time (the expo-font plugin in
 * app.config.ts), which the web can't do. The same files, declared as @font-face with their weights,
 * so the families and font-* classes match the phone. (web-fonts.ts is the native no-op.)
 */
const FACES: [family: string, weight: number, file: number][] = [
  ['Figtree', 400, require('@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf')],
  ['Figtree', 500, require('@expo-google-fonts/figtree/500Medium/Figtree_500Medium.ttf')],
  ['Figtree', 600, require('@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf')],
  ['Bricolage Grotesque', 700, require('@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf')],
];

const style = document.createElement('style');
style.textContent = FACES.map(
  ([family, weight, file]) =>
    `@font-face { font-family: '${family}'; font-weight: ${weight}; font-display: block; src: url('${Asset.fromModule(file).uri}') format('truetype'); }`,
).join('\n');
document.head.appendChild(style);
