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

## Phase B — Shared Web-Feature Parity on Android

Status: implementation complete; awaiting PR gate.

Evidence:
- Android renders the same shared React launcher, catalogue, appearance, profile, account-management and sync surfaces as Web.
- No Android-only fork or duplicate product UI was introduced.
- Android external links now use the installed official Capacitor Browser plugin instead of a legacy global plugin lookup/window fallback.
- Automated parity guards assert the shared account/profile/sync/launcher surface remains available to Android.

Platform-specific app/game launch behaviour remains intentionally assigned to Phase D. Physical-device parity acceptance remains assigned to Phase G.
