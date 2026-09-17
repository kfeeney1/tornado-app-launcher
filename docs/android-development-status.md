# Tornado Android development status

## Phase A — Android Runtime and Firebase Correctness

Status: complete (PR #42)

Evidence:
- Firebase Auth and Firestore use the bundled npm Firebase SDK.
- Installed Android builds no longer depend on Firebase Hosting `/__/firebase/init.json` or runtime-loaded gstatic modules.
- Required Firebase public-client fields are validated with a controlled `firebase/configuration-missing` failure.
- Capacitor App and Browser plugins are pinned and synced with the Android project.
- Firebase runtime configuration tests, lint, shared production build, Capacitor sync, Android debug APK build, CodeQL, Quality, Playwright smoke, Firestore rules tests, and Windows packaging regression checks passed in PR #42.

Physical-device authentication/profile/sync acceptance remains part of the final Android acceptance session.
