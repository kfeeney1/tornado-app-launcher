# Android Production Acceptance

## Phase G — Production Acceptance and Parity Sign-off

This document is the authoritative Android acceptance gate for Tornado. Android uses the same React/Vite product and account/cloud architecture as Web and Windows; native Android code is limited to platform integration.

## Automated acceptance

The following must be green on the Phase G pull request and on `main` before Android can be considered engineering-complete:

- Quality — lint, shared tests and Playwright coverage.
- CodeQL — security analysis.
- Android Build — Android/Firebase contract tests, Capacitor sync, Gradle unit tests, Android lint and debug APK assembly.
- Release Android — repeatable AAB/APK packaging when manually dispatched for a release candidate.

## Feature parity matrix

| Capability | Android implementation | Automated evidence | Device acceptance |
| --- | --- | --- | --- |
| Shared launcher UI/configuration | Shared React product | Quality + Android shared-parity tests | Required |
| Firebase startup/config | Bundled Firebase SDK/runtime validation | `firebase-runtime.test.mjs` | Required |
| Authentication/account | Shared AuthProvider/account UI | shared tests + Android parity contract | Sign in/out required |
| Cloud profile/config sync | Shared Firestore/cloud layer | shared tests + Android parity contract | Cross-device load/save required |
| Appearance/settings | Shared product configuration | Android shared-parity tests | Required |
| Android Back/home exit | AndroidLifecycleBoundary + Capacitor App | Android lifecycle tests | Required |
| Background/resume | AndroidLifecycleBoundary | Android lifecycle tests | Required |
| External browser | Capacitor Browser adapter | platform/Android tests | Required |
| Native app/game launch | Capacitor App Launcher | Android launching tests | Installed-target test required |
| Missing-app fallback | resolver Play Store/official URL fallback | Android launching tests | Missing-target test required |
| Release packaging | Gradle + Release Android workflow | workflow/build contract | Signed release required for production distribution |

## Physical-device acceptance checklist

Run on a representative supported Android device before declaring unrestricted production GO:

1. Install the release candidate from a clean state and confirm startup/loading completes without runtime configuration errors.
2. Sign in with a Firebase account, sign out, then sign in again.
3. Change launcher/profile configuration and verify it persists after restart and appears on another signed-in client where applicable.
4. Exercise appearance/settings and confirm the same portable settings semantics as Web/Windows.
5. Navigate into nested screens and verify Android Back returns one level; on the home/root screen verify exit requires confirmation.
6. Background and resume Tornado and confirm the current usable state is retained/reconciled.
7. Open an external web target and confirm Capacitor Browser behaviour.
8. Launch configured installed Android apps/games, including representative catalog targets.
9. Test at least one absent app/game and confirm the Play Store or official installation fallback is offered/opened rather than failing silently.
10. Upgrade over an earlier Tornado Android build and verify account/configuration remains intact.
11. Uninstall/reinstall and verify expected local-vs-cloud restoration semantics after sign-in.
12. For production distribution, install the signed release from the intended distribution channel (Play internal track if used) and repeat the critical startup/auth/launch checks.

Record device model, Android version, build version/version code, date, tester and pass/fail notes with the release evidence.

## Signing and distribution gate

Repository code must never contain production signing credentials. Production signing requires the protected keystore/password/alias material described in `docs/android-release.md`. A debug or unsigned release artifact proves buildability but is not evidence of a production-signed Play release.

## Sign-off classification

- **GO** — automated gates green, signed production artifact verified, physical-device checklist passed, and intended distribution-channel acceptance passed.
- **GO WITH DOCUMENTED LIMITATIONS** — engineering/automation gates green but production signing, physical-device acceptance or distribution-channel validation remains outstanding. Suitable for continued internal engineering validation, not an unrestricted production declaration.
- **NO-GO** — a required automated gate fails, a release artifact cannot be built, or device acceptance exposes a release-blocking defect.

Until the physical-device and production-signing evidence is recorded, Phase G must report **GO WITH DOCUMENTED LIMITATIONS**, not GO.
