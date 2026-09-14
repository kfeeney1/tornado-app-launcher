# Phase 9 production operations

Phase 9 starts from Tornado `0.1.0` and the Phase 8 Windows NSIS release pipeline.

## Release states

Tornado uses four states: development, release candidate, production release, and replaced/deprecated release. Ordinary CI artifacts are never production releases.

A release candidate is a GitHub draft release at `v<version>`. It contains the exact installer, checksum, and `release-manifest.json` intended for production. Stable promotion publishes that same draft without rebuilding or replacing assets.

## Candidate and promotion process

The manual **Release Windows** workflow has two operations:

- `candidate`: validate source, package Windows, create checksum and provenance manifest, then create a draft release.
- `promote`: re-download the draft assets, verify filename, version, tag, channel and SHA-256, then publish the same draft as the latest stable release.

Existing tags and releases are immutable and are not reused.

## Update delivery

The supported production update path is currently manual and user-approved through the official GitHub Releases page. Settings → About shows the installed version and links to that trusted source.

Automatic installation remains deferred until trusted Windows signing credentials exist and signed stable release history has been validated. Firestore and user configuration cannot override the release source.

Only the stable channel is operated. SemVer rules reject malformed metadata, equal/older versions and prereleases on the stable channel.

## Signing

Signing is ready to use through release-workflow secrets. No signing key is stored in the repository or exposed to pull-request builds. The release manifest records whether signing credentials were present. Unsigned builds remain clearly an external trust limitation and no SmartScreen bypass is attempted.

## Provenance

Each release is traceable to version, Git tag, commit SHA, workflow run, artifact filename, SHA-256, signing state and release timestamps. `release-manifest.json` is generated from the packaged artifact and contains no secrets.

## Failure and recovery

Release validation fails closed. A packaging, checksum or manifest error prevents candidate creation or promotion. Existing installed Tornado remains usable when the release service or network is unavailable because update installation is not automatic.

Rollback does not rewrite tags or replace an existing version. Maintainers identify the last known-good immutable release and then prepare a normal patch release using the same PR, CI, candidate and promotion path.

## Patch releases

Production issue → fix branch → PR/CI → patch version → release candidate → validation → stable promotion → post-release checks.

Urgency does not bypass normal validation.

## Reinstall and uninstall

Cloud account data is not removed by Windows uninstall. The NSIS package explicitly preserves Tornado application data (`deleteAppDataOnUninstall: false`) so device-local settings remain available for reinstall. Any future installer change that removes local state requires explicit tests and release-note disclosure.

## Firebase and compatibility

Windows continues to use the existing Firebase Authentication and Firestore architecture. Admin credentials are never bundled. New desktop releases must preserve account sync and avoid weakening rules. Portable configuration should remain compatible while older and newer clients temporarily coexist.

## Release checklist

1. Main is green.
2. Version and release notes are reviewed.
3. Candidate is built from the intended immutable SHA.
4. Installer, checksum and manifest are present.
5. Packaged startup smoke passes.
6. Clean-machine install and previous-version upgrade are checked.
7. Authentication and Firestore sync are checked.
8. Native app and game launch are checked.
9. Signing state is reviewed.
10. Candidate checksum is verified.
11. Candidate is promoted without rebuilding.

## Post-release checklist

1. Latest release resolves to the promoted version.
2. Published checksum matches the installer.
3. Manifest version, tag, SHA, artifact and checksum agree.
4. Installer and application launch successfully.
5. Authentication and sync work.
6. Native app/game launch works.
7. Previous clients can reach the trusted update source.
8. Tornado Web still works.

## Release notes and deprecation

Production notes should explain major user-visible improvements, important fixes, security-relevant changes, known issues and upgrade notes. Older immutable releases remain traceable. The latest stable version is supported; forced shutdown of old clients is not part of Phase 9.

## Supportability

Phase 9 does not add remote telemetry. Settings → About exposes safe local support diagnostics containing only Tornado version, client/platform type, portable/device configuration schema versions, sync status and update mode.

Packaged Windows operational logs are stored beneath Electron's application user-data directory in `logs/tornado.log`, with one rotated `tornado.log.1` backup. Each active log is bounded to approximately 512 KiB. Logs cover startup/shutdown, renderer-load failure, window-state recovery/persistence failure, installed-app discovery failure, game-resolution failure and native-launch failure.

Diagnostics and logs must never include auth tokens, Firebase credentials, Windows usernames, full executable paths, email addresses or private user data. Sensitive metadata keys are redacted and path-like text is sanitized before writing.

## External prerequisite

A trusted Windows code-signing certificate remains the external prerequisite before introducing automatic update installation. Until then, the manual stable-release path is the production mechanism.
