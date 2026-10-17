#!/bin/sh
# Builds a shareable zip of the Chrome extension (without test files) into
# releases/. The zip unpacks to a "grid-companion-extension" folder that people
# load with Chrome's "Load unpacked".
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
rm -rf "$OUT/$NAME"
echo "Built $OUT/$NAME.zip (v$VERSION)"
