# Phase 8 — Windows Distribution, Updating & Release Readiness

## Baseline

Phase 8 starts from `main` commit `02a5559bd3cf7178c65c2f9bccf67650d78db681`, after Phase 7 PRs #22 and #23 were merged. Tornado remains one shared React/Vite application with an Electron Windows shell. Electron is pinned through electron-builder configuration at 44.3.0 and electron-builder is invoked at 26.15.3.

The authoritative Tornado product version is `package.json#version`. Phase 8 keeps the existing `0.1.0` version; version changes are deliberate SemVer edits, never per-commit increments.

## Primary Windows package

The primary Windows distribution format is an x64 NSIS installer. The release filename is:

`Tornado-Setup-<version>.exe`

The app ID remains `ie.tornado.launcher` and product name remains `Tornado`. Normal CI also creates an unpacked directory for startup smoke testing, but unpacked output is not a public distribution format.

The installer is per-user, allows an installation-directory choice, creates a Start Menu shortcut, and relies on electron-builder/NSIS upgrade semantics. Tornado application data lives in Electron userData and is not intentionally removed during upgrades. Arbitrary downgrade compatibility is not guaranteed; older builds must not be used to rewrite release tags.

## Release trigger and source traceability

`.github/workflows/release-windows.yml` is manual (`workflow_dispatch`). A normal merge to `main` never publishes a Windows release.

The operator supplies:

- `release_ref`: exact commit SHA or controlled ref to release
- `version`: SemVer that must match `package.json`
- `publish`: false to stage a release candidate, true to publish after validation

Published releases use tag `v<version>`. The workflow refuses to rewrite an existing tag.

## Validation and artifacts

The release workflow runs normal quality gates before packaging: lint, functions syntax, unit tests, Electron/platform tests, Web build, Firebase emulator rules tests and Playwright. Windows packaging then validates required desktop Firebase build configuration, creates an unpacked app for startup smoke testing, and builds the NSIS installer.

The final installer gets a SHA-256 sidecar:

`Tornado-Setup-<version>.exe.sha256`

Only the installer and checksum are staged/published. Intermediate unpacked directories remain CI evidence only.

## Firebase release configuration

Packaged Electron uses the same Firebase project and shared renderer architecture as Web. A packaged `file://` renderer cannot use Firebase Hosting's `/__/firebase/init.json`, so release builds require the public Firebase Web configuration through repository Actions secrets:

- `TORNADO_FIREBASE_API_KEY`
- `TORNADO_FIREBASE_AUTH_DOMAIN`
- `TORNADO_FIREBASE_PROJECT_ID`
- `TORNADO_FIREBASE_APP_ID`

These are Firebase client configuration values, not Admin credentials. Firebase service-account JSON or Admin private keys must never be bundled into the desktop application. The release validator fails rather than producing a misleading build when required client configuration is absent.

## Code signing

No signing certificate is committed. The workflow is ready for electron-builder signing through CI secrets:

- `WINDOWS_CSC_LINK`
- `WINDOWS_CSC_KEY_PASSWORD`

If those secrets are not configured, a candidate can be built outside the privileged publish path for engineering validation, but a public Windows release should be treated as unsigned and may trigger Microsoft Defender SmartScreen/reputation warnings. Do not bypass SmartScreen or suppress warnings. Proper Authenticode signing is an external prerequisite for a polished public release.

Signing secrets are only referenced by the manually triggered Windows release workflow and are not exposed to pull-request CI.

## Update strategy

Phase 8 deliberately selects a manual, user-approved stable-channel update strategy instead of adding an unsigned auto-updater prematurely.

Official update source: GitHub Releases for `kfeeney1/tornado-app-launcher`.

The trusted source is controlled by the release workflow. Firestore, user settings and portable Tornado configuration cannot provide executable update URLs. Automatic update installation is deferred until signed artifacts and a stable release history exist.

Future auto-update work should use an established Electron updater compatible with signed NSIS releases; it must not introduce arbitrary renderer-controlled URLs.

## Release channels

Only `stable` exists in Phase 8. No beta/nightly channel is created speculatively.

## Rollback

Never overwrite previous binaries or move an existing release tag. For a bad release:

1. identify the previous known-good GitHub Release;
2. direct users to that preserved installer if necessary;
3. fix forward with a new PATCH version;
4. retain the bad release/tag for auditability unless there is a security reason to withdraw the asset.

## Release notes

GitHub can generate the first draft from merged changes, but the release operator must review notes for user-impacting changes, bug/security fixes and known issues before public distribution. Raw commit history is not a substitute for release notes.

## Smoke checklist

Automated where practical:

- dependency install with `npm ci`
- lint/unit/platform/Electron tests
- Firebase security tests
- Playwright
- Web production build
- unpacked Windows app startup
- NSIS installer generation
- SHA-256 generation

Manual release-candidate validation still required on a clean Windows environment:

- install
- first launch
- Firebase sign-in
- restore session
- Apps and Games views
- installed-app discovery
- launch a supported app/game
- Settings/Profile
- close and relaunch
- upgrade from the previous known-good version
- confirm device-local paths/resolution data and window state survive
- uninstall and confirm expected user-data policy

## Local commands

- `npm ci`
- `node scripts/validate-release.mjs`
- `npm run desktop:dir`
- `npm run desktop:build`

`desktop:dir` is for local/CI smoke testing. `desktop:build` creates the release installer.

## Security review

Phase 8 keeps renderer sandboxing, context isolation and Node isolation unchanged. The release source is repository-controlled, not Firestore-controlled. The release workflow uses read-only repository permissions until the optional publish job, which alone gets `contents: write`. Pull-request CI cannot access release signing secrets. Checksums are computed from the final installer. No Firebase Admin credential is shipped.

## Known external prerequisites

Before a public production release:

- configure the four required public Firebase Web build values in Actions secrets;
- acquire/configure a Windows code-signing certificate or approved cloud-signing equivalent;
- complete clean-machine install and previous-version upgrade validation on real Windows;
- review generated release notes before setting `publish=true`.

## Phase 9 recommendation

After Phase 8 has at least one signed stable release, Phase 9 should focus narrowly on signed auto-update UX and production release observability: established Electron updater integration, trusted stable-channel metadata, user-approved install/restart flow, failure recovery, and update-specific integration tests. It should not expand into subscriptions, telemetry, Store submission, macOS/Linux packaging or system tuning.
