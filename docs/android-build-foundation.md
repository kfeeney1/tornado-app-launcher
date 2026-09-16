# Android Build Foundation

Work Block 2 establishes the native Android build path for Tornado while preserving the shared React/Vite application.

## Architecture

- Shared UI and product logic remain in the existing React/Vite application.
- Capacitor is the Android shell; there is no second Android React application.
- Android application ID: `ie.tornado.launcher`.
- Web assets are built into `dist` and synchronized into the native project.
- The native project is generated from the committed Capacitor configuration in CI during this foundation block.

## Developer workflow

1. `npm ci`
2. `npm run build`
3. `npm run android:add` (first native checkout only)
4. `npm run android:sync`
5. Open with `npm run android:open`, or build a debug APK with `npm run android:build:debug`.

## CI acceptance

The Android Build workflow creates a fresh native project, synchronizes the shared web build, compiles a debug APK, and uploads the APK as a workflow artifact. This proves that Android can be built reproducibly without committing credentials or requiring a developer workstation.

## Security and release boundaries

This block produces an unsigned/debug development artifact only. Production signing credentials, Play Store publishing, release tracks, and irreversible store identity decisions are intentionally deferred to the Android release-pipeline work block. No Firebase service-account or Android signing credentials belong in the repository.
