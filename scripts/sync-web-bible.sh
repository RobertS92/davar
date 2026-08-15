#!/usr/bin/env bash
# Sync Bible data/types/parser from the native Expo app into the web app.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

mkdir -p "$ROOT/web/src/data" "$ROOT/web/src/types" "$ROOT/web/src/services"

cp "$ROOT/src/data/kjvBible.ts" "$ROOT/web/src/data/kjvBible.ts"
cp "$ROOT/src/types/bible.ts" "$ROOT/web/src/types/bible.ts"
cp "$ROOT/src/services/bibleParser.ts" "$ROOT/web/src/services/bibleParser.ts"

# Fix relative imports inside the copied parser
# bibleParser already uses ../types/bible which matches web layout

echo "Synced KJV data, bible types, and bibleParser into web/"
