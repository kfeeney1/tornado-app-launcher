# Phase B — Shared Parity & Cross-Device Acceptance

## Starting state

- Starting `main`: `0486898cc86b87944a2ae39ae1780bbfcadacf01`
- Phase A PR #33 is merged and its automated Quality workflow passed before merge.
- Phase A real-Windows-machine launcher acceptance remains explicitly deferred under the product-owner gate exception dated 15 September 2026.
- No Phase A Windows acceptance result is represented as passed by this phase.

## Objective

Phase B proves that Tornado's shared account experience is one product across Web and Windows rather than two configuration systems. The authoritative portable model remains the existing shared React/Firebase sync architecture; Windows contributes device-local capabilities without changing account-owned portable data.

## Live-state findings

The repository already contains substantial Phase B capability from the earlier account/configuration stages:

- Firebase authentication and account lifecycle UI
- account-scoped portable cache
- Firestore-backed portable configuration
- independent appearance, launcher and preferences sync domains
- real-time listener propagation
- offline pending-write recovery
- account-switch isolation
- device registry with Web/Android/Windows platform records
- device-local Windows configuration separated from portable account configuration
- shared catalogue IDs and ordered launcher selection

The existing Stage 4 architecture is therefore reused rather than replaced.

## Authoritative parity contract

### Portable/account-owned

The following must behave consistently for the same signed-in account on supported clients:

- authentication/account identity
- launcher selections
- launcher ordering
- portable appearance/theme
- portable preferences represented by the shared schema
- sync state and recovery semantics
- account switching/isolation
- device registry visibility

Portable configuration uses stable Tornado catalogue IDs. It must not contain executable paths, Start Menu paths, native launch targets, installed-app evidence, Android package state, Windows discovery state, window geometry, native permissions or other device-local details.

### Device-local

The following remain installation/device-owned:

- Windows installed-app discovery
- Windows game/launcher evidence
- Windows filesystem/native launch resolution
- Android package/install availability
- native permissions
- hardware/display/native preferences
- local window/lifecycle state

Signing out or switching accounts must not turn device-local Windows information into account data or leak one account's portable cache into another account.

## Acceptance matrix

| Journey | Automated acceptance available without a Windows install | Real Windows install required |
| --- | --- | --- |
| Sign in/out and account isolation | Yes | Deferred smoke confirmation |
| Appearance follows same account | Yes, multi-client Playwright | Deferred packaged confirmation |
| Launcher selections/order follow same account | Yes, shared sync tests | Deferred packaged confirmation |
| Established cloud config restores to fresh local cache | Yes | Deferred packaged confirmation |
| Offline change remains usable and flushes after reconnect | Yes | Deferred packaged confirmation |
| Device registry schema supports Windows without path data | Yes | Deferred real-device record confirmation |
| Windows native app/game execution | Logic/security/CI only | **Required; inherited Phase A debt** |
| Stale native target repair | Logic/security/CI only | **Required; inherited Phase A debt** |

## Automated gate for Phase B

Before Phase B can merge, CI must continue to require:

- lint
- unit tests
- Electron/desktop security tests
- release validation
- Web production build
- Firestore owner-isolation/rules tests
- Playwright Web smoke and shared sync tests
- Windows packaging/build validation already present in Quality

The shared sync regression suite must continue to cover:

1. active-client appearance propagation
2. active-client launcher propagation
3. cloud restore after account-cache removal
4. offline local update and reconnect flush
5. account switching without portable-data leakage
6. portable/device-local separation
7. sign-out preserving device-local state
8. owner-isolated Firestore access

## Windows-machine exception

The product owner has authorised Phase B and later development to continue while a Windows machine is unavailable. Accordingly, Phase B may be merged when its code/automated acceptance is green even though packaged same-account Web/Windows confirmation cannot yet be executed.

This is a scheduling exception, not an acceptance waiver. The deferred checks accumulate into the next phase whose purpose genuinely requires a Windows installation. At the latest, they are blocking before Tornado Windows is declared feature-complete or release-ready.

Any defect discovered during deferred Windows acceptance is a blocking regression and must be repaired before release promotion.

## Phase B completion definition under the exception

Phase B's development gate is satisfied when:

- the shared parity contract is documented and remains represented by one shared implementation
- automated sync/account/device-boundary tests are green
- Web regression is green
- Windows package/build automation remains green
- no P0/P1 parity defect is known from automated evidence
- the PR is merged and `main` is re-inspected
- deferred real-Windows acceptance is explicitly carried forward

Only then may Phase C implementation begin.
