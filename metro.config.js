const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Web only (`npm run web`, for quick UI checks): expo-sqlite runs SQLite as WebAssembly. Its
// cross-origin headers come from scripts/web.mjs.
config.resolver.assetExts.push('wasm');

module.exports = withNativeWind(config, { input: './src/global.css', configPath: './tailwind.config.ts' });
