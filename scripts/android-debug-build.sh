#!/usr/bin/env bash
set -euo pipefail
npm run build
npx cap add android || true
npx cap sync android
cd android
./gradlew assembleDebug
