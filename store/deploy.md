# Deploying a new version

Every release is a new store build: the app has no over-the-air updates.

## 1. Check

```sh
npm run typecheck && npx expo lint && npm test
```

## 2. Bump the version

```sh
npm run version:bump            # 1.0.1 → 1.0.2 (or: -- minor / -- major)
```

Each upload needs a higher version: the build number is derived from it. Commit the bump.

## 3. Build (iOS)

```sh
npx eas-cli@latest build -p ios --profile production
```

Runs in the cloud (~15 min); follow it on expo.dev. Nothing to install locally.

## 4. Send it to App Store Connect

```sh
npx eas-cli@latest submit -p ios --latest
```

About 10 minutes later the build shows up in TestFlight. Install it on the iPhone and check it opens.

## 5. Release

In [App Store Connect](https://appstoreconnect.apple.com) → the app:

First release only: fill in the listing, privacy and age rating from `store/app-store.md` and add the screenshots, then skip to step 3.

1. **+ Version** (top of the left column) with the new number, e.g. 1.0.2.
2. **What's New in This Version**: a line or two, in English and French.
3. **Build**: pick the one just uploaded.
4. **Add for Review**, then **Submit for Review**.

Review usually takes a day or two. The listing text lives in `store/app-store.md`, the screenshots in `store/screenshots/`. They only need updating when the app's look changes.

## Screenshots (when needed)

```sh
npx expo run:ios --configuration Release --device 62E100FB-3EAE-46C8-804D-8709B376E2CE
SIM=62E100FB-3EAE-46C8-804D-8709B376E2CE ./scripts/screenshots/take.sh
```

The first command needs Xcode closed. The second asks you to tap **Open** in the simulator, then press Enter, for each link.

## Android test build

```sh
npx eas-cli@latest build -p android --profile preview
```

Gives an APK link to install directly on a phone. No Play Store yet.
