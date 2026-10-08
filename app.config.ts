import type { ExpoConfig } from 'expo/config';

import pkg from './package.json';

/*
 * The app's configuration, from which Expo generates the native projects (ios/, android/).
 *
 * Versioning: package.json's version is the single source (bump it with scripts/version.sh). The
 * build number, which the stores require to grow with every upload, is derived from it:
 * 1.2.3 → 10002003 (major, then 4 digits of minor, 3 of patch).
 */
const version = pkg.version;
const [major, minor, patch] = version.split('-')[0].split('.').map(Number);
const buildNumber = major * 10_000_000 + minor * 1_000 + patch;

const GOOGLE_FONTS = './node_modules/@expo-google-fonts';
const FONT_FILES: Record<string, Record<number, string>> = {
  Figtree: {
    400: `${GOOGLE_FONTS}/figtree/400Regular/Figtree_400Regular.ttf`,
    500: `${GOOGLE_FONTS}/figtree/500Medium/Figtree_500Medium.ttf`,
    600: `${GOOGLE_FONTS}/figtree/600SemiBold/Figtree_600SemiBold.ttf`,
  },
  'Bricolage Grotesque': {
    700: `${GOOGLE_FONTS}/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf`,
  },
};

const config: ExpoConfig = {
  name: 'Habits',
  slug: 'habits',
  // The Expo account the EAS project belongs to (@arn0-be/habits).
  owner: 'arn0-be',
  version,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'habitudes',
  userInterfaceStyle: 'automatic',
  ios: {
    icon: './assets/habits.icon',
    bundleIdentifier: 'com.arnaudetienne.habitudes',
    buildNumber: String(buildNumber),
    supportsTablet: false,
    // Free "Personal Team"; replace with the paid account's team ID for TestFlight.
    appleTeamId: 'Y7N85AJQFD',
    infoPlist: {
      // Lets the app open shared JSON files ("Open in Habits"); iOS copies them into the app's Inbox.
      CFBundleDocumentTypes: [
        { CFBundleTypeName: 'Backup (JSON)', LSHandlerRank: 'Alternate', LSItemContentTypes: ['public.json'] },
      ],
      LSSupportsOpeningDocumentsInPlace: false,
      // Only standard encryption (HTTPS, iOS's own): answers App Store Connect's export question once and for all.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    // Same identifier as iOS. Permanent once published on the Play Store.
    package: 'com.arnaudetienne.habitudes',
    versionCode: buildNumber,
    // "Open with Habits" for JSON files (Daygraph's export, a shared backup): Android passes a
    // content:// URL, handled like iOS's shared files (+native-intent.tsx).
    intentFilters: [
      {
        action: 'VIEW',
        category: ['DEFAULT', 'BROWSABLE'],
        data: [{ scheme: 'content', mimeType: 'application/json' }, { scheme: 'file', mimeType: 'application/json' }],
      },
    ],
    adaptiveIcon: {
      backgroundColor: '#12141C',
      foregroundImage: './assets/images/android-icon-foreground.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    ['expo-splash-screen', { backgroundColor: '#12141C', image: './assets/images/splash-icon.png', imageWidth: 120 }],
    'expo-sqlite',
    [
      'expo-font',
      {
        // Same family names on both platforms ("Figtree", "Bricolage Grotesque", see theme/tokens.ts),
        // so font-medium / font-semibold pick the right file through fontWeight. iOS reads the
        // family from the files; Android needs it declared, weight by weight.
        ios: { fonts: Object.values(FONT_FILES).flatMap((weights) => Object.values(weights)) },
        android: {
          fonts: Object.entries(FONT_FILES).map(([fontFamily, weights]) => ({
            fontFamily,
            fontDefinitions: Object.entries(weights).map(([weight, path]) => ({ path, weight: Number(weight) })),
          })),
        },
      },
    ],
    ['expo-localization', { supportedLocales: { ios: ['en', 'fr'], android: ['en', 'fr'] } }],
    '@react-native-community/datetimepicker',
    // Must stay BEFORE expo-notifications: see the plugin's comment.
    './plugins/without-push-entitlement',
    'expo-notifications',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    // Links the project to its EAS project on expo.dev (cloud builds, submissions).
    eas: { projectId: '34331754-8bf5-4738-bade-258fcff81823' },
  },
};

export default config;
