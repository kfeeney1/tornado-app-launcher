# Phase 6 — Device-local Windows configuration

Starting `main`: `1cfbd3f5ca5665ecc5ee0fccb40fab16b05bef1c`.

## Existing architecture retained

Tornado already separated portable account configuration from device configuration. Phase 6 extends that existing device store rather than creating a second persistence mechanism.

Portable configuration remains limited to shared Tornado account state such as appearance and selected Tornado IDs. Windows machine facts remain in the versioned local device record under `tornado-device-config-v1` and are not part of Firestore cloud documents.

## Device schema v2

The local device schema advances from v1 to v2 and preserves:

- platform
- installation identity
- validated local launch-target metadata
- bounded installed/resolution evidence
- simple native preferences

The migration is in-place and idempotent. Existing v1 executable-path records are retained as local data but are not made executable by this phase. Arbitrary command fields are discarded by validation.

## Resolution persistence

Windows discovery and game resolution now persist bounded evidence keyed by stable Tornado app IDs. A cached record contains only:

- installed boolean
- allowlisted launcher identity, when applicable
- local evidence source
- last checked timestamp

Discovery payload extras such as executable paths or usernames are not copied into installed-state records.

A five-minute cache lifetime avoids repeatedly querying Windows while ensuring Tornado does not treat old evidence as permanent truth.

## Stale-state recovery

If native launch fails, Tornado invalidates the affected app's cached resolution/launch-target state before using the official install fallback. The next launch attempt must resolve the app again from current local evidence.

Corrupt or missing device state falls back safely to a clean versioned device config. Future unknown schema versions are preserved rather than overwritten.

## Account switching

Machine-global installation facts remain machine-global across sign-out/sign-in and account switching. Account-owned portable/sync caches continue to use their existing per-UID keys and account cleanup does not remove the machine device record.

No account-specific manual executable preference is introduced because the current supported catalogue resolves through registered protocols and launcher evidence. This avoids adding unnecessary filesystem-selection privilege. If a future catalogue item genuinely requires manual executable selection, it must use a narrowly scoped picker plus trusted-main validation; raw paths must never become portable cloud configuration or arbitrary command input.

## Cloud boundary

Cloud validators accept only the existing appearance, launcher and preferences documents. Device `launchTargets` and `installedApps` are not represented in portable configuration or Firestore schemas.

Windows-local state may contain a legacy/manual executable path, but it remains local and Phase 3 native launch continues to execute only trusted allowlisted protocol targets. Cloud data cannot turn such a local record into executable shell input.

## Tests

Phase 6 adds or updates deterministic coverage for:

- v1 → v2 device migration
- corrupt and future device schemas
- local persistence across reloads
- bounded installed-state persistence
- stale-cache expiry
- launch-failure invalidation
- fresh rediscovery after stale state
- account cleanup/switching preserving machine facts
- portable/device update isolation
- no device paths or installed-state records in portable configuration
- sanitization of command-like extra fields

Existing CI continues to cover lint, unit tests, Electron/platform security tests, Web build, Firebase emulator rules tests, Playwright and Windows packaging.

## Deferred

No manual executable picker is added because current Tornado catalogue entries do not require it. Desktop window lifecycle, fullscreen evaluation, navigation polish, optional startup behaviour and final Windows product integration belong to Phase 7.
