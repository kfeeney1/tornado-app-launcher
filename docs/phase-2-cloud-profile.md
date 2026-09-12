# Phase 2 — Cloud Profile & Configuration Schema

Phase 2 establishes Tornado's private Firestore account foundation. It does **not** synchronize local launcher configuration automatically.

## Identity and document hierarchy

Firebase Authentication `uid` is the only Tornado account identifier.

```text
users/{uid}
  schemaVersion
  email
  displayName
  createdAt
  updatedAt

users/{uid}/config/appearance
users/{uid}/config/launcher
users/{uid}/config/preferences
```

No `webUsers`, `androidUsers` or platform-specific account collections are used.

The root profile is created transactionally by `ensureUserProfile(user)` only when it does not already exist. Repeated initialization therefore does not recreate or reset an existing profile. Configuration documents are **not** created just because the profile exists; a missing document remains distinguishable from an explicitly saved empty configuration.

## Schema versioning

Current profile, appearance, launcher and preferences schemas are version `1`. Constants and runtime validators live in `src/cloud/schema.js`; companion TypeScript declarations live in `src/cloud/schema.d.ts`.

Reads are validated before data is returned to application code. Unknown or malformed configuration is surfaced as a controlled state instead of blindly cast into launcher state.

## Portable data

The current application has two persisted user-configurable values that are suitable for future account portability:

- appearance theme (`dark` / `light`)
- launcher selection/order, represented by stable Tornado catalogue IDs

Launcher cloud data uses IDs such as `minecraft`, `fortnite`, `roblox`, `spotify` and `discord`. The catalogue remains responsible for resolving those IDs to platform-specific launch/install information.

## Device-specific data

The following data is explicitly outside the portable cloud schema and must remain local when introduced or detected:

- Android package availability
- Windows executable/install paths
- download folders
- OS permissions
- hardware/performance configuration
- platform-specific launch commands
- window position and dimensions
- temporary caches
- Firebase authentication persistence internals

The existing catalogue may contain Android package names and native launch URLs as platform metadata. Phase 2 does not copy those values into user configuration documents.

## Central Firestore access

`src/cloud/cloudProfile.js` owns Firestore reads/writes and exposes focused operations:

- `ensureUserProfile(user)`
- `getUserProfile(uid)`
- `getAppearanceConfig(uid)` / `setAppearanceConfig(uid, config)`
- `getLauncherConfig(uid)` / `setLauncherConfig(uid, config)`
- `getPreferences(uid)` / `setPreferences(uid, config)`

UI components should not scatter direct `getDoc`, `setDoc` or `updateDoc` calls.

Appearance, launcher and preferences are separate documents, so an appearance write cannot overwrite launcher selections and a launcher write cannot replace appearance.

## Local state preservation and offline behaviour

Phase 2 does not read cloud configuration into `App.jsx` and does not write the existing `tornado-theme` or `tornado-selection` localStorage values to Firestore. Signing in therefore cannot silently replace or upload a configured local launcher.

`CloudProfileProvider` prepares only the small root profile. If Firestore is unavailable, offline, denied or malformed, the provider records a controlled unavailable state while the already-local Tornado launcher continues to render.

Full local/cloud synchronization, merge rules, conflict resolution and pending-write behaviour belong to Phase 4/5.

## Security rules

`firestore.rules` makes `users/{uid}` private to the matching authenticated Firebase user:

```text
request.auth != null && request.auth.uid == uid
```

Anonymous access is denied. User A cannot read or write User B's profile or configuration. Profile/config writes are additionally shape-checked and schema-version checked. Root profile deletion is disabled; permitted configuration documents are limited to `appearance`, `launcher` and `preferences`.

## Emulator tests

CI starts Firebase Auth and Firestore emulators against a demo project and runs `tests/firestore-rules.test.mjs`. The test creates two Auth-emulator users and proves:

- User A can read/write User A profile
- User B cannot read User A profile
- anonymous users cannot read User A profile
- User A cannot write User B profile
- equivalent isolation applies to configuration documents

Pure schema validation tests live in `tests/unit/cloud-schema.test.mjs`.

Run locally with Firebase CLI available:

```bash
node --test tests/unit/*.test.mjs
npx firebase-tools@latest emulators:exec --project demo-tornado-app-launcher --only auth,firestore "node --test tests/firestore-rules.test.mjs"
```

## Firestore enablement and rules deployment

Repository tooling cannot confirm whether the Cloud Firestore database has already been created in Firebase Console for project `tornado-app-launcher`.

If Firestore is not enabled, perform this one-time manual action:

1. Open Firebase Console → project `tornado-app-launcher`.
2. Open **Firestore Database**.
3. Choose **Create database**.
4. Select the production database mode/location appropriate for the existing project.
5. Do not install permissive development rules such as `allow read, write: if true`.

After Firestore exists, run the GitHub Actions workflow **Deploy Firestore Rules**. It validates schema/rules tests first and then deploys only `firestore:rules` using the existing `FIREBASE_SERVICE_ACCOUNT_TORNADO_APP_LAUNCHER` secret.

Firestore rules deployment is deliberately separate and manual; the existing `main` → Firebase Hosting live deployment workflow is not broadened or replaced.

## Android / Capacitor

The current `main` branch still does not contain a committed Capacitor/Android project, so an APK-level Firestore test cannot be run in Phase 2 from this repository state. The cloud layer uses the same Firebase Web SDK/app instance as Phase 1 and contains no platform-specific user collection or path data, so it remains compatible with a future shared React/Capacitor client.

When Android is reintroduced, provide the same Firebase client configuration used by Phase 1 and verify Auth + Firestore on-device without changing the `users/{uid}` hierarchy.

## Not synchronized yet

Phase 2 does not implement:

- local → cloud settings synchronization
- cloud → local settings synchronization
- realtime multi-device sync
- migration/merge UI
- conflict resolution
- device registry
- remote sign-out
- avatars/social sign-in/subscriptions/parental profiles

The correct user-facing description is **Cloud profile ready**, not **Synced**.
