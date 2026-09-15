# Phase D — Packaged Windows Acceptance

## Baseline

Phase D starts from `main` SHA `4083b088d1908e4d9dca84c05f1ee861c45647e7`, the merge commit for Phase C PR #35.

The repository already has one authoritative Windows release workflow. Phase D reuses it; it does not create a second packaging or release system.

## What CI can prove

For a release candidate, the existing workflow must:

1. pin an immutable source SHA;
2. run lint, unit, desktop, Web build, Firestore rules and Playwright smoke tests;
3. package on a Windows runner;
4. launch the unpacked `Tornado.exe` and prove that it remains running for the smoke interval;
5. build `Tornado-Setup-<version>.exe`;
6. generate and verify a SHA-256 checksum;
7. generate release provenance;
8. upload the installer, checksum and manifest together;
9. create an immutable draft release candidate;
10. promote exactly those validated candidate artifacts without rebuilding them.

These are automated package-construction assurances. They are not evidence that an installer has been installed and exercised by a person on a real Windows machine.

## Real Windows acceptance — mandatory before Phase D closes

Use the release-candidate installer produced from the final Phase D `main` SHA. Record the candidate version, source SHA and checksum before testing.

### D1 — clean install

- Verify the downloaded installer checksum against the candidate `.sha256` file.
- Install Tornado on a supported Windows machine.
- Confirm installation completes without an unexpected error.
- Launch Tornado from the installed application/Start Menu entry.
- Confirm the main launcher renders and remains usable after closing and reopening it.

### D2 — shared product journeys

- Sign in with a normal Tornado account.
- Confirm the expected launcher catalogue/configuration loads.
- Confirm Profile, Settings and Add Apps are reachable and Home returns to the launcher.
- Change one portable setting or launcher selection, then confirm it remains account-owned and sync-capable rather than becoming Windows-only state.
- Sign out and back in and confirm the account state is restored without leaking another account's state.

### D3 — native Windows app launch

With at least one supported native app such as Spotify, Discord or Notion installed:

- confirm Tornado identifies it as installed;
- confirm the UI offers native launch;
- launch it and verify the correct installed application opens;
- confirm no executable path, Start Menu path or shortcut path appears in portable/cloud configuration.

### D4 — game lifecycle

Exercise the supported game states using Minecraft, Fortnite or Roblox as available:

- installed game: detected and native launch succeeds;
- missing game: Tornado offers the correct official install destination rather than a broken native launch;
- stale evidence: when a previously valid target is no longer usable, Tornado invalidates/repairs or falls back safely rather than repeatedly trusting stale evidence.

Do not damage a working installation merely to manufacture stale evidence. A naturally stale target, safe uninstall/reinstall, or other reversible test is sufficient.

### D5 — Windows desktop behaviour

- A second Tornado launch focuses/restores the existing app instead of producing an uncontrolled duplicate instance.
- Minimise/restore works.
- Close and reopen works.
- Navigation remains usable with mouse and keyboard.
- External Web destinations open outside the Tornado renderer where designed.
- An invalid saved window position must not make Tornado permanently inaccessible; only exercise this if it can be done safely and reversibly.

### D6 — upgrade and rollback regression

The earlier release programme already established upgrade/rollback mechanics. Re-run the relevant path with the final feature-complete candidate if its version differs from the installed stable build:

- install/upgrade without losing portable account state;
- retain valid device-local state where compatible;
- if rollback is required, use the documented safe rollback path and confirm Tornado remains launchable.

## Evidence record

Phase D cannot be marked complete with statements such as “packaging passed” alone. Record:

- Windows version used;
- Tornado candidate version;
- immutable source SHA;
- installer SHA-256 result;
- D1–D6 pass/fail/not-applicable result;
- any defect and its fixing PR;
- final retest result.

Screenshots are useful but are not mandatory when a concise written result identifies the test and outcome.

## Gate

Automated CI/package checks may be merged before real-machine acceptance, under the previously authorised scheduling exception. However:

- Phase D remains **acceptance pending** until D1–D6 are completed where applicable;
- inherited Phase A/B/C real-Windows acceptance debt is covered by the consolidated D1–D6 session and is not silently waived;
- any defect discovered during that session is a blocking regression;
- Phase E implementation that does not depend on the missing Windows result may be prepared only if doing so does not claim feature-complete/release-ready status;
- Tornado must not be declared feature-complete or release-ready until this gate is satisfied.
