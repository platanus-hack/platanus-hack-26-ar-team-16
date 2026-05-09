#!/usr/bin/env bash
# Build and deploy the Expo Web bundle to gohan-app-theta.vercel.app.
#
# Why this exists: `npx expo export -p web` puts the @expo/vector-icons font
# files inside `dist/assets/node_modules/...`. The Vercel CLI silently strips
# any directory literally named `node_modules` during upload, so the icon
# fonts 404 in production and every Ionicons / MaterialCommunityIcons glyph
# renders as an empty square. We sidestep it by renaming the segment to
# `_pkg` and patching every reference in the bundle before uploading.
#
# Usage:
#   bash scripts/deploy-app-web.sh
#
# Requires: vercel CLI logged in to the team, expo CLI available via npx.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

VERCEL_SCOPE="team_yfa8SfuCMHozDSEprkntzlzO"
PROJECT_NAME="gohan-app"

echo "─── 1/4 Exporting Expo web bundle ───"
rm -rf dist
npx expo export --platform web

echo "─── 2/4 Writing vercel.json (frame-ancestors + SPA rewrites) ───"
cat > dist/vercel.json <<'JSON'
{
  "version": 2,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Frame-Options", "value": "ALLOWALL"},
        {"key": "Content-Security-Policy", "value": "frame-ancestors *"}
      ]
    }
  ],
  "rewrites": [
    {"source": "/((?!_expo|assets|favicon\\.ico|metadata\\.json).*)", "destination": "/index.html"}
  ]
}
JSON

echo "─── 3/4 Renaming dist/assets/node_modules → dist/assets/_pkg + patching bundle ───"
if [ -d dist/assets/node_modules ]; then
  mv dist/assets/node_modules dist/assets/_pkg
  find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) \
    -exec sed -i '' 's|assets/node_modules|assets/_pkg|g' {} +
fi

echo "─── 4/4 Deploying to Vercel ───"
cd dist
npx vercel --prod --yes --scope "$VERCEL_SCOPE" --name "$PROJECT_NAME"

echo "Done — https://gohan-app-theta.vercel.app should now serve the latest build."
