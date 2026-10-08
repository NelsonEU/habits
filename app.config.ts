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

const config: ExpoConfig = {
  name: 'Habits',
  slug: 'habits',
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
    versionCode: buildNumber,
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
        fonts: [
          './node_modules/@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf',
          './node_modules/@expo-google-fonts/figtree/500Medium/Figtree_500Medium.ttf',
          './node_modules/@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf',
          './node_modules/@expo-google-fonts/bricolage-grotesque/700Bold/BricolageGrotesque_700Bold.ttf',
        ],
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
};

export default config;
