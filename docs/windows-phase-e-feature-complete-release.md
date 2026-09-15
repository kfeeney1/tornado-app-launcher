# Phase E — Feature-Complete Windows Release

## Baseline

Phase E starts from `main` SHA `9ce68206043810f97c1f99e0f7d98b104cb9c67c`, the Phase D PR #36 merge commit.

The objective is to converge Tornado Windows into the final shared product/release state. This phase does not add speculative desktop features or create another Windows application, release workflow, sync system or catalogue.

## Feature-complete definition

Tornado Windows is feature-complete only when the shared product and Windows platform together provide the intended MVP journeys:

- shared React/Vite product remains authoritative for Web and Windows;
- Firebase Authentication/account lifecycle works through the shared UI;
- portable launcher configuration and settings remain account-owned and sync-capable;
- device-local/native Windows resolution remains local to the device;
- supported installed applications can be discovered and launched natively where supported;
- supported games have installed, missing, stale/repair and official-install fallback lifecycles;
- Profile, Settings, Add Apps and Home navigation remain coherent;
- Electron security boundaries remain restricted and typed;
- Windows packaging produces an installable, attributable release candidate from an immutable source SHA;
- Web behaviour remains supported by the same codebase.

## Final automated gate

Before a Phase E implementation PR may merge, required Quality CI must remain green. The release path must continue to prove:

1. lint and unit tests;
2. Electron/platform security and desktop lifecycle tests;
3. production Web build;
4. Firebase rules ownership tests;
5. Playwright shared-product regression;
6. Windows package construction on a Windows runner;
7. unpacked executable smoke launch;
8. installer, SHA-256 and provenance creation;
9. candidate promotion without rebuilding the validated installer.

A green automated gate is necessary but does not replace the real Windows acceptance gate.

## Release-blocking acceptance debt

Phase D deliberately records D1–D6 as real-machine acceptance. Those checks consolidate the deferred Phase A/B/C acceptance debt. Until that session passes, Phase E may be implemented and merged but its release state is **feature-complete candidate — Windows acceptance pending**.

Do not describe Tornado as feature-complete, release-ready or production-accepted until D1–D6 have been completed where applicable and all discovered defects have been fixed and retested.

## Final release sequence

When automated Phase E CI is green:

1. merge the Phase E implementation PR;
2. verify the exact resulting `main` SHA;
3. choose the next unused SemVer release-candidate version rather than overwriting an existing release;
4. build the candidate from that exact `main` SHA through the existing `Release Windows` workflow;
5. record candidate version, source SHA, checksum and provenance;
6. perform the consolidated D1–D6 real-Windows acceptance session against that exact installer;
7. if a defect is found, fix it through a protected PR, create a new candidate version from the new `main`, and repeat affected acceptance checks;
8. only after acceptance passes, promote the exact validated candidate artifacts without rebuilding them.

## Non-goals

Do not add tray behaviour, start-with-Windows, telemetry, notifications, system tuning, arbitrary executable launching, release-channel expansion, social features or a separate Windows-only UI merely to make this phase larger.

## Exit state

There are two distinct states and they must not be conflated:

- **Implementation complete:** shared code, automated tests and package/release contracts are green on `main`.
- **Release accepted:** implementation complete plus the exact final candidate has passed D1–D6 real-Windows acceptance and any blocking regressions have been closed.

Phase E can reach the first state without immediate access to the Windows machine. It cannot reach the second state without the real-machine evidence.
