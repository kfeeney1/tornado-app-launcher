# Stage 3 — Portable & Device Settings Architecture

Stage 3 establishes a local configuration boundary that is safe for the later sync engine. It does **not** read Tornado launcher configuration from Firestore and does **not** upload local launcher configuration to Firestore.

## Live-state inventory

Before Stage 3, persisted launcher state was limited to two application-owned `localStorage` keys in `src/App.jsx`:

- `tornado-theme` — `dark` or `light`
- `tornado-selection` — ordered stable Tornado catalogue IDs

Firebase Auth also persists its own authentication state. The Playwright test adapter uses `tornado-test-auth-session`; that is authentication infrastructure, not Tornado launcher configuration, and is intentionally outside the Stage 3 config service.

No application-owned IndexedDB persistence, Capacitor Preferences persistence, Windows executable-path persistence, Android installed-package persistence, window-position persistence, or other native device settings exist on the current `main` baseline. The repository currently contains the web app plus Android-aware launch fallback metadata; it does not contain a native Android/Capacitor project tree.

## Configuration classes

| Setting / state | Classification | Stage 3 representation |
| --- | --- | --- |
| Selected apps | Portable | `portable.launcher.selectedItemIds` stable IDs |
| Selected games | Portable | `portable.launcher.selectedItemIds` stable IDs |
| App order | Portable | relative order of stable app IDs |
| Game order | Portable | relative order of stable game IDs |
| Theme (dark/light) | Portable | `portable.appearance.theme` |
| General launcher preferences | Portable | `portable.preferences` (currently empty) |
| Catalogue item web URL | Application definition | `src/data/catalog.js`, not user config |
| Native launch URI | Application/platform definition | `src/data/catalog.js`, resolved by `src/platform/launchResolver.js` |
| Android package ID | Application/platform definition | `src/data/catalog.js`, never portable user config |
| Android Play Store fallback | Application/platform definition | resolver input, never portable user config |
| Installed/not-installed status | Device | reserved for `device.launchTargets` / native integration; not currently detected/persisted |
| Windows executable path | Device | reserved for `device.launchTargets`; not currently implemented |
| Window/display/native preferences | Device | `device.nativePreferences`; currently empty |
| Device platform | Device | `device.platform` |
| Search text | Session/transient | React state only |
| Current page/view | Session/navigation | history state only |
| Download/add progress | Session/transient | React state only |
| Account form messages/errors | Session/transient | React state only |
| Auth initialization/loading state | Session/auth infrastructure | Auth provider only |

## Local schemas

Portable configuration is stored under `tornado-portable-config-v1`:

```json
{
  "schemaVersion": 1,
  "appearance": { "theme": "dark" },
  "launcher": { "selectedItemIds": ["browser", "spotify", "minecraft"] },
  "preferences": {}
}
```

Device configuration is stored independently under `tornado-device-config-v1`:

```json
{
  "schemaVersion": 1,
  "platform": "web",
  "launchTargets": {},
  "nativePreferences": {}
}
```

The corresponding TypeScript boundaries are documented in `src/config/schema.d.ts`. Runtime validation and persistence live in `src/config/localConfig.js`.

## Migration

The migration reads the real pre-Stage-3 keys, validates recoverable values, then writes the two versioned Stage 3 records. Selected IDs remain in their original order. Duplicate/invalid IDs are discarded rather than allowed to corrupt startup. Legacy keys are removed only after both new records are durable.

Migration is idempotent. If the current records already validate, no migration is repeated. A persisted schema version newer than the running build is treated as unsupported and is left untouched rather than being overwritten by older code. Malformed current data falls back safely so Tornado can still launch.

Storage access and quota/security failures are handled without making Tornado crash; updates return the last valid in-memory/default configuration if persistence fails.

## Stable IDs and platform resolution

Portable launcher configuration stores stable Tornado IDs such as `spotify`, `minecraft`, and `roblox`. It does not store Android package IDs, Play Store URLs, native URIs, or future Windows paths.

`src/platform/launchResolver.js` converts a catalogue definition plus the current platform/user agent into a launch target. On Android it prefers the Play Store fallback when one exists; elsewhere it uses the normal install/web fallback. `LauncherCard` consumes the resolver instead of making the platform decision itself.

This leaves room for a future Windows resolver/native adapter without changing the portable account schema.

## Firestore compatibility and Stage 4 boundary

Stage 2 already defines cloud `appearance`, `launcher`, and `preferences` documents with the same core domain values: theme and ordered stable item IDs. Stage 3 deliberately wraps those domains into one local portable record for atomic local migration and persistence. Stage 4 can provide the explicit serialization/sync boundary between this local portable record and the Stage 2 Firestore documents.

Stage 3 does not call `getAppearanceConfig`, `getLauncherConfig`, `setAppearanceConfig`, or `setLauncherConfig` from the launcher UI. `CloudProfileProvider` continues to prepare the authenticated user's profile only. Therefore sign-in does not overwrite local launcher settings, and changing a setting does not upload it.

Firestore Rules are unchanged by Stage 3. Stage 2 owner-only access remains the security boundary for future cloud configuration.

## Account switching and sign-out

Portable and device configuration are independent from Firebase Auth state. Signing out does not delete device configuration and does not currently delete the local portable configuration. Stage 4/5 must define account-scoped portable caches before multiple authenticated accounts begin synchronizing on one installation.

Until then, Stage 3 intentionally avoids associating or uploading the local portable record with any UID.

## Tests

Coverage includes:

- portable/device defaults and schema validation
- deterministic/idempotent migration from the exact legacy keys
- app/game ordering and appearance preservation
- malformed data recovery
- unsupported-future-schema preservation
- portable/device update isolation
- device launch-target retention locally
- Android versus non-Android fallback resolution
- Playwright upgrade migration from legacy local storage
- reload persistence
- sign-out preserving portable/device records
- existing auth, launcher, Back-navigation, mobile and game-launch regression suites

## Scope deliberately deferred

Stage 4 owns automatic Firestore synchronization, real-time listeners, cloud/local merge semantics, first-login migration choices, conflict resolution and account-scoped cloud cache behavior. Native Android package detection, a Windows application, Windows executable discovery, device registration and remote device management are also not introduced here.
