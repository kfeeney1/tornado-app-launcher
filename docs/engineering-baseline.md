# Tornado engineering baseline

This document is the authoritative index for current engineering guidance. Historical `phase-*`, `stage-*`, and `windows-phase-*` documents are retained as implementation/release evidence; they are not current policy unless linked below.

## Current architecture

Tornado is one React/Vite product with platform adapters. Web is hosted on Firebase Hosting, Windows uses the Electron main/preload boundary, and Android is represented by a restricted adapter but does not yet have a committed native Capacitor project.

Authoritative architecture and security sources:

- `README.md` — product overview and local development entry point.
- `src/platform/contracts.js` and `src/platform/adapters/` — platform capability boundary.
- `electron/main/` and `electron/preload/` — Windows privileged boundary.
- `firestore.rules` — cloud authorization policy.
- `docs/phase-8-windows-release-readiness.md`, `docs/phase-9-production-operations.md`, `docs/phase-10-production-support.md` — Windows release and operations evidence.
- `docs/windows-deferred-acceptance.md` — outstanding real-machine acceptance evidence.

## Testing policy

Tests should prove product behaviour, security boundaries, data/schema validation, release invariants, or a small number of genuinely enforceable acceptance contracts. Tests whose only purpose is to assert that a phase/marker document contains words are process noise and should not be used as completion evidence.

The shared Quality workflow is the primary automated gate. Windows packaging is a distinct platform gate. Android becomes a distinct gate once a native project exists.

Lint is expected to run with zero warnings. Dependency versions must be intentional and the lockfile is authoritative for clean installs.

## Documentation policy

Current guidance belongs in a small set of topic-oriented documents (architecture, development/testing, platform support, security, release, manual acceptance, and operations). Historical phase records may remain for traceability, but new work must not create marker/completion files simply to prove that a phase occurred.

## Repository security

Never commit service-account JSON, signing keys, API secrets, passwords, or local SDK paths. Firebase Web client configuration is public application configuration and must not be confused with privileged service-account credentials. Repository administrators should keep GitHub secret scanning and push protection enabled where available and require the meaningful Quality and Windows checks on `main`. Android should be added as a required check after its CI job is stable.

## Baseline recorded 2026-09-15

Starting `main`: `75e5b9f66aa62db381f64b9aecbede64dfcfa6fc`.

At this baseline there were no open pull requests or issues. The latest `main` Quality workflow and Firebase Hosting deployment both succeeded. Windows releases `v0.1.0` and `v0.1.1` predate current `main`; `v0.1.1` targets `efe7feb46849325f190d932d735cf9a92e4d8c1a`. The package manifest still used uncontrolled `latest` ranges and Firebase Auth/Firestore were dynamically loaded from gstatic. Android had a restricted adapter but no committed native project.

Repository administration decisions that cannot be safely inferred (notably license choice and owner-only security/ruleset settings) remain manual decisions rather than being marked complete in code.