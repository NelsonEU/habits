#!/bin/bash
# Bumps the app's version (patch by default). app.config.ts reads it from package.json and derives
# the iOS build number and Android version code from it, so there's nothing else to update.
set -euo pipefail

VERSION_TYPE=${1:-"patch"}

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
  echo "Error: argument must be 'major', 'minor' or 'patch' (default: patch)."
  exit 1
fi

cd "$(dirname "$0")/.."
current_version=$(node -p "require('./package.json').version")
echo "Current version: $current_version. Applying '$VERSION_TYPE' update..."

npm version "$VERSION_TYPE" --no-git-tag-version > /dev/null
new_version=$(node -p "require('./package.json').version")
build_number=$(npx expo config --json 2>/dev/null | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).ios.buildNumber")

echo "Updated to $new_version (build number $build_number)."
echo "If everything is ok, commit with:"
echo "  git add package.json package-lock.json && git commit -m \"Move to $new_version\""
