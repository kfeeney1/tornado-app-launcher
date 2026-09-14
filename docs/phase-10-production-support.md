# Phase 10 — Production support, reliability and maintainability

## Baseline

Phase 10 starts from `main` at `efe7feb46849325f190d932d735cf9a92e4d8c1a` with Tornado `0.1.1`. Phase 9 established candidate/stable release promotion, release provenance, SHA-256 verification, a manual trusted update path, bounded local logging and support diagnostics. Stable releases `v0.1.0` and `v0.1.1` exist and the v0.1.1 upgrade/rollback drill was completed operationally.

Windows code signing remains an external prerequisite. Automatic executable installation remains disabled; stable GitHub Releases is the trusted update source.

## Reliability model

Tornado startup is treated as staged work:

1. Electron starts and creates the protected browser window.
2. The renderer performs bounded local configuration recovery.
3. React mounts behind a global recovery boundary.
4. Firebase Auth restores identity.
5. Cloud profile and sync start for an authenticated user.
6. Device/native capability providers start.
7. Optional discovery, resolution and update actions occur on demand.

A failure in optional discovery/update work must not be treated as loss of user data. A renderer programming failure presents a reload option and stable identifier `TORNADO-UI-001` rather than a blank application.

## Local configuration schemas

Portable local configuration:

- current schema: `1`
- storage key: `tornado-portable-config-v1`
- last-known-good key: `tornado-portable-config-lkg-v1`

Device-local configuration:

- current schema: `2`
- storage key: `tornado-device-config-v1`
- last-known-good key: `tornado-device-config-lkg-v1`
- supported migration: device schema `1` → `2`

The existing migration layer remains authoritative for legacy theme/selection migration and device v1 → v2 migration. Phase 10 adds a bounded startup recovery layer ahead of it.

### Last-known-good behaviour

On startup:

- a valid current config is copied to one last-known-good slot;
- malformed/invalid current config is restored only when the backup also validates against the current schema;
- unsupported newer schemas are preserved and are never overwritten by an older client;
- there is exactly one backup per portable/device configuration, so backup growth is bounded;
- if no valid backup exists, the existing migration/default path remains responsible for safe fallback and the condition is visible in diagnostics.

No migration executes code or reads arbitrary files.

## Portable/cloud compatibility

Firestore portable documents remain explicitly versioned independently:

- profile schema: `1`
- appearance schema: `1`
- launcher schema: `1`
- preferences schema: `1`

A newer unknown cloud schema is classified as unsupported rather than destructively rewritten by an older client. Current code should preserve this rule for future clients.

## Diagnostics

Settings → About → Support diagnostics is safe to paste into a support issue. It contains only:

- Tornado version
- client category
- portable/device schema versions
- startup recovery result
- sync state
- update channel/mechanism

It intentionally excludes credentials, Firebase secrets, tokens, full profile data, Windows usernames and executable paths.

A support bundle is deliberately deferred. Current diagnostics plus bounded local logs are sufficient for the present product size and avoid introducing a second sensitive-data export path.

## Logging

Electron operational logs are JSON-lines under Electron `userData/logs` and are bounded to approximately 512 KiB plus one rotated predecessor. Logging failures cannot block startup. Metadata redacts token/secret/password/credential/API-key/path/username/email-like keys and path-like strings.

Do not add access tokens, refresh tokens, Firebase credentials, passwords, full email addresses or arbitrary local paths to logs.

## Offline/Firebase outage behaviour

Expected behaviour during temporary network/Firebase failure:

- device-local configuration remains available;
- native launch/discovery may remain available because it is local;
- cloud sync is reported as offline/error and may retry through the existing sync layer;
- local state must not be deleted merely because Firestore/Auth is temporarily unavailable;
- users should not be told to delete the Tornado data directory as a routine outage fix.

If an Auth session is no longer valid, Tornado should return to the normal authentication path rather than remain indefinitely in a loading state.

## Account/local-data boundaries

Machine-global/device-local data includes launch targets, installed-app state, native preferences, installation identity and window state. Portable account state includes appearance and launcher selection in account-scoped caches/cloud documents.

Sign-out removes authentication session state but intentionally does not erase genuine machine/device capability data. Account switching must not expose another account's portable cache through UI state. Account deletion removes the current user's known cloud tree before deleting Auth identity; device-local machine state remains local unless a separate user action resets it.

## Native reliability

Installed-app discovery remains bounded by Start Menu roots, maximum recursion depth and maximum entry count. Individual inaccessible directories and symbolic links are skipped rather than aborting discovery. Native launch remains allowlisted/resolved through the platform layer; Phase 10 does not relax command validation or permit arbitrary shell commands.

## Update/release recovery

Production update state remains:

`development → draft candidate → validation → promote identical assets → stable release`

If a stable release is bad:

1. stop promoting that version;
2. use the last known-good immutable release when configuration compatibility permits;
3. develop a patch on a branch;
4. require normal PR/Quality checks;
5. increment version;
6. create a new candidate from the exact merged SHA;
7. validate clean install/upgrade;
8. promote the exact candidate assets.

Do not rewrite release tags or replace already-published binaries.

## Windows compatibility policy

The supported Windows baseline must be evidence-based. CI validates the packaged application on GitHub's current `windows-latest` runner and Phase 9 manual release validation covers the actual production installer lifecycle. Tornado should not claim support for obsolete Windows versions that are not exercised by current Electron or release testing.

For release notes, state the Windows versions actually tested for that release. Do not infer a broader support matrix from installer success alone.

## Dependency maintenance

Phase 10 does not perform an indiscriminate dependency upgrade. `npm ci` and the committed lockfile remain mandatory for CI/release reproducibility. `electron-builder` is explicitly pinned in release-critical scripts. Dependency automation may open reviewable PRs, but may not auto-merge or publish production releases.

The package manifest currently uses `latest` ranges for several Web/test dependencies; this is technical debt because a future lockfile refresh can pull breaking majors. Convert these to deliberate version ranges in a dedicated dependency-maintenance PR after Phase 10, with CI/package regression testing.

## Main protection and CI

`main` is protected by an active repository ruleset requiring a pull request and the `quality` status check. Quality includes lint, unit tests, Electron/platform tests, release validation, Web build, Firebase rules/emulator tests, Playwright and a Windows package/smoke build.

Do not remove assertions or required checks merely to obtain a green run.

## Support runbook

### App will not start or UI is blank

1. record Tornado version and Windows version;
2. retry once using the recovery screen if shown;
3. collect Support diagnostics if Settings is reachable;
4. inspect bounded Electron logs;
5. check startup recovery state for corrupt/invalid configuration;
6. verify the installed package is an official release artifact;
7. avoid deleting all local data unless targeted recovery has failed.

### User cannot sign in

1. verify connectivity;
2. verify Firebase Auth availability/account state;
3. distinguish offline from revoked/expired identity;
4. retry through the normal sign-in path;
5. do not clear device-native mappings as an authentication fix.

### Sync is unavailable

1. check diagnostics sync state;
2. verify network/Firestore availability;
3. preserve local state;
4. allow the existing deterministic retry/reconciliation path to recover;
5. do not overwrite unsupported newer cloud schemas.

### Native app/game will not launch

1. confirm discovery/resolution result;
2. check whether the target was removed/moved;
3. rerun bounded resolution/discovery;
4. inspect redacted native-launch log event;
5. keep command validation intact; never bypass the resolver with arbitrary shell execution.

### Update fails

1. confirm current version/channel;
2. verify the official GitHub stable release exists;
3. compare installer SHA-256 with release evidence;
4. retry download manually if connectivity was interrupted;
5. if the new release itself is defective, follow immutable rollback/patch procedure above.

## Security reporting

Do not paste tokens, passwords, private credentials or exploitable secret material into public GitHub Issues. Security-sensitive reports should use GitHub private security reporting when enabled/available for the repository, or be shared privately with the maintainer until a private reporting channel is configured.

## Known limitations

- Windows binaries may still be unsigned until trusted signing credentials are configured, so SmartScreen/reputation warnings can occur.
- Updates are user-approved/manual through trusted GitHub Releases; there is no automatic executable installation.
- Installed-app/game discovery supports a bounded known catalogue and does not recursively scan entire disks.
- A general support-bundle exporter is intentionally not implemented.
- Exact Windows support beyond tested release environments is not claimed.

## Phase 10 validation checklist

Automated:

- startup-recovery unit tests
- existing local schema migration/regression tests
- Electron security tests
- platform/native discovery tests
- Firebase rules tests
- Playwright Web/auth/sync/config tests
- Web production build
- Windows unpacked startup smoke
- Windows installer build
- release metadata validation

Manual/release evidence:

- clean installer launch
- sign in and sync
- discovery/native launch for supported targets
- close/reopen
- offline/reconnect behaviour
- update/upgrade/relaunch
- sign out/account switch
- diagnostics copy
- uninstall/reinstall state expectations

Phase 10 does not claim a manual scenario was performed merely because automation or documentation exists.

## Deliberately deferred

Store publication, macOS/Linux, enterprise management, telemetry, monetisation, remote administration, system tuning and broad feature-flag infrastructure remain out of scope.
