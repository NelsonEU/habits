# Habits

A personal iOS app to track a few daily habits: open it in the evening, tick what you kept, close it. It replaces Daygraph and can import its backups.

Built with [Expo](https://expo.dev) (React Native, TypeScript, Expo Router).

## Run it

```sh
npm install
npx expo run:ios --device   # first build, or after adding a native library (close Xcode first)
npx expo start              # day-to-day: serves the code to the installed app
```

On a free Apple account the installed app expires after 7 days: run `npx expo run:ios --device` again (data is kept).

## Versioning

```sh
npm run version:bump            # 1.0.0 → 1.0.1 (or: minor, major)
```

`package.json` holds the version; `app.config.ts` derives the iOS build number and Android version code from it (1.2.3 → 10002003).

## Checks

```sh
npm run typecheck
npx expo lint
npm test
```

To also check the importer against a real Daygraph backup, put it at `private/daygraph-backup.json` (git-ignored).

## Layout

- `src/app/` — screens (Expo Router: one file per route)
- `src/components/` — shared UI
- `src/theme/` — design tokens
- `src/domain/` — dates and statistics, plain TypeScript, unit-tested
- `src/import/` — Daygraph backup import
