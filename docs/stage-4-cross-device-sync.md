# Stage 4 — Cross-Device Sync Engine

Stage 4 synchronizes account-owned **portable** Tornado configuration while keeping device configuration local. The implementation is local-first: an authenticated client loads its account-scoped cache immediately, then reconciles it with Firestore and starts real-time listeners.

## Cloud structure

The existing Stage 2 paths remain authoritative for portable account configuration:

- `users/{uid}/config/appearance` — `{ schemaVersion: 1, theme }`
- `users/{uid}/config/launcher` — `{ schemaVersion: 1, selectedItemIds }`
- `users/{uid}/config/preferences` — `{ schemaVersion: 1 }`

The launcher list contains stable Tornado catalogue IDs only. It never contains Windows paths, Android package availability, filesystem state, native permissions, device IDs, window geometry or other device state.

No Firestore indexes are required for these direct document reads/listeners.

## Local state and initialization metadata

Stage 4 adds an account-scoped portable cache:

- `tornado-account-portable-v1:{uid}`

The pre-Stage-4 portable cache remains the one-time migration source. `tornado-portable-legacy-owner-v1` records which UID claimed that legacy cache so a second account on the same installation cannot inherit the first account's launcher.

Pending portable writes are recorded by domain under:

- `tornado-sync-pending-v1:{uid}`

Together with the portable `schemaVersion`, document existence and pending-domain state this distinguishes:

- never initialized account cache — no account cache key
- initialized account cache — valid account cache exists
- migrated pre-sync cache — legacy owner key identifies the account that claimed it
- modified but not yet synchronized — domain is present in the pending set
- current/unsupported schema — validated from `schemaVersion`

Cloud document **existence** is significant. A missing launcher document is not the same as an existing launcher document whose `selectedItemIds` is deliberately empty.

## First synchronization

For each portable domain independently:

1. Load the account-scoped local cache immediately and render it.
2. Read the cloud domain.
3. If the cloud document exists and validates, cloud wins for that domain unless the local domain is explicitly pending from offline work.
4. If the cloud document is missing, seed it from the valid local domain.
5. If the cloud document is malformed or from a future unsupported schema, preserve the local value, do not overwrite the cloud document, and surface a controlled sync problem.
6. Start one real-time listener per portable domain.

This makes a fresh installation load an established cloud launcher while ensuring an existing local user signing into an uninitialized account does not lose their launcher.

## Granularity and conflict rules

Appearance, launcher and preferences synchronize as separate Firestore documents. A theme write cannot overwrite a launcher change made by another client.

Within the same domain the model is deliberately simple: Firestore's accepted write order is last-write-wins. Launcher ordering is one ordered stable-ID list, so a concurrent change to that same ordered list is also last-write-wins. Stage 4 does not introduce a CRDT or event log.

Cloud listener updates are applied directly to local state and are **not** sent back to Firestore. Only user-originated local mutations schedule cloud writes, preventing feedback loops. Writes are coalesced per domain with a short debounce.

## Offline behaviour

The account-scoped cache is always updated before a cloud write. The affected domain is marked pending before the write is attempted.

If Tornado is offline:

- the launcher remains usable from the local cache
- portable changes update the UI immediately
- the domain remains pending
- the Profile screen reports `Offline — changes will sync when connected`

When connectivity returns, pending domains are written from the current validated local cache and cleared only after the write succeeds. This gives Tornado an application-level durable recovery path without storing a second copy of the full configuration queue.

## Account switching and sign-out

Firestore listeners and debounced timers are owned by the current SyncProvider lifecycle and are cleaned up when the UID changes or the provider unmounts.

Portable cache keys are UID-scoped. A different account therefore loads its own cache/defaults and its own Firestore documents. Device configuration remains unchanged because it belongs to the installation rather than an account.

The old unscoped portable cache can be claimed only once, preventing User B from inheriting User A's migrated pre-sync settings.

## Portable versus device-only

Synchronized:

- selected apps
- selected games
- app/game relative order through the ordered stable-ID launcher list
- portable dark/light appearance
- portable preferences represented by the Stage 3 preferences domain

Not synchronized:

- platform and installed-app state
- Android package availability
- Android Play Store availability
- Windows executable or filesystem paths
- native launch targets
- hardware/display/native preferences
- permissions
- navigation/history state
- search text
- download progress
- auth internals

Platform launch resolution remains in `src/platform/launchResolver.js`, so a future Windows client can consume the same stable cloud IDs without changing the account schema.

## Sync states

The application exposes:

- `disabled`
- `initializing`
- `syncing`
- `synced`
- `offline`
- `error`

The Profile screen translates these into user-facing account sync language rather than Firestore terminology.

## Validation and schema handling

Every cloud document is validated independently before it is applied. An invalid appearance document does not destroy valid launcher data. Future schema versions are classified as unsupported and are never overwritten by this older client.

Unknown-but-valid stable catalogue IDs remain in portable configuration; rendering ignores IDs that are not in the current catalogue, so one deprecated catalogue entry does not stop the rest of the launcher loading.

## Tests

Stage 4 coverage includes:

- first-sync seeding from local state
- established cloud state winning on a fresh cache
- malformed-domain isolation
- redundant-write/loop prevention primitives
- account cache isolation
- simultaneous active-page appearance and launcher propagation
- cache-clear/cloud restore behaviour
- offline local update and reconnect flush
- existing Firebase Emulator owner-isolation rules coverage
- existing authentication, browser Back and launcher/game-launch regression coverage

The Playwright test adapter provides deterministic cloud-like storage for browser synchronization scenarios; production builds use the real Firestore service and real-time `onSnapshot` listeners.

## Android and future Windows clients

The repository still does not contain a native Android/Capacitor project tree, so Stage 4 cannot run native Android instrumentation in this repository. The shared sync layer is platform-neutral and stores only stable Tornado IDs and portable values. Android package/install resolution stays device-local, and the same boundary is ready for a future Windows adapter.
