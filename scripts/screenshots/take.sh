#!/bin/bash
# Takes the App Store screenshots on the 6.9" simulator, in English and French, with the designed
# demo data of seed.py (habit 1, "No screens in bed", is the one shown in detail). The clock shows
# 21:30: it's an evening app.
# Run it in a terminal: it pauses at each link for you to confirm it in the simulator.
# Requires a Release build of the app installed on that simulator:
#   npx expo run:ios --configuration Release --device "iPhone 18 Pro Max"
# Output: store/screenshots/<lang>/<n>-<screen>.png
set -euo pipefail
cd "$(dirname "$0")/../.."

SIM="${SIM:-iPhone 18 Pro Max}"
APP=com.arnaudetienne.habitudes
TODAY=$(date +%F)

xcrun simctl boot "$SIM" 2>/dev/null || true
xcrun simctl bootstatus "$SIM" -b >/dev/null
xcrun simctl status_bar "$SIM" override --time 21:30 --dataNetwork wifi --wifiBars 3 --cellularBars 4 --batteryState charged --batteryLevel 100

DB="$(xcrun simctl get_app_container "$SIM" "$APP" data)/Documents/SQLite/habits.db"

shot() { # <lang> <name> <url or empty> <appearance>
  xcrun simctl ui "$SIM" appearance "$4"
  xcrun simctl terminate "$SIM" "$APP" 2>/dev/null || true
  xcrun simctl launch "$SIM" "$APP" -AppleLanguages "($1)" -AppleLocale "$([ "$1" = fr ] && echo fr_FR || echo en_US)" >/dev/null
  sleep 7  # the first launch after seeding is slow; 3 s caught the splash screen
  if [ -n "$3" ]; then
    # The iOS 27 simulator asks "Open in Habits?" for every link: tap Open, then press Enter here.
    xcrun simctl openurl "$SIM" "$3"
    read -rp "  Tap Open in the simulator, then press Enter " </dev/tty
    sleep 1
  fi
  xcrun simctl io "$SIM" screenshot "store/screenshots/$1/$2.png" >/dev/null
  echo "  $1/$2"
}

for lang in en fr; do
  mkdir -p "store/screenshots/$lang"
  # Run once so the migrations create the tables, then replace the data.
  xcrun simctl launch "$SIM" "$APP" >/dev/null; sleep 3
  xcrun simctl terminate "$SIM" "$APP"
  python3 scripts/screenshots/seed.py "$DB" "$lang" "$TODAY"
  # The first launch on new data is slow (it stayed on the splash screen): warm up, unrecorded.
  xcrun simctl launch "$SIM" "$APP" >/dev/null; sleep 10
  xcrun simctl terminate "$SIM" "$APP"

  shot "$lang" 1-today "" dark
  shot "$lang" 2-stats "habitudes://stats" dark
  shot "$lang" 3-detail "habitudes://stats/1" dark
  shot "$lang" 4-today-light "" light
  shot "$lang" 5-new-habit "habitudes://habits/new" dark
done

xcrun simctl ui "$SIM" appearance dark
xcrun simctl status_bar "$SIM" clear
sips -g pixelWidth -g pixelHeight store/screenshots/en/1-today.png | tail -2
