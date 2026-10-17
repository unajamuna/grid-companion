#!/bin/sh
# Builds two zips of the Chrome extension into releases/ (test files left out):
#   grid-companion-extension.zip        for GitHub: unpacks to a folder for "Load unpacked"
#   grid-companion-extension-store.zip  for the Chrome Web Store: manifest.json at the top
set -e
cd "$(dirname "$0")/.."
VERSION=$(python3 -c "import json;print(json.load(open('extension/manifest.json'))['version'])")
OUT=releases
NAME=grid-companion-extension
rm -rf "$OUT/$NAME" && mkdir -p "$OUT/$NAME"
cp -R extension/. "$OUT/$NAME/"
rm -rf "$OUT/$NAME/dev"
(cd "$OUT" && rm -f "$NAME.zip" && zip -qr "$NAME.zip" "$NAME" -x '*.DS_Store')
cp "$OUT/$NAME.zip" "$OUT/$NAME-v$VERSION.zip"
# The Web Store wants the files at the zip's top level, and doesn't need the README.
(cd "$OUT/$NAME" && rm -f README.md ../"$NAME-store.zip" && zip -qr ../"$NAME-store.zip" . -x '*.DS_Store')
rm -rf "$OUT/$NAME"
echo "Built $OUT/$NAME.zip and $OUT/$NAME-store.zip (v$VERSION)"
