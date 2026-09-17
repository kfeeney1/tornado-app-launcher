# Android release engineering

Tornado Android is built from the same React/Vite source used by Web and Windows and packaged with Capacitor.

## Versioning

`package.json` is the product version source. Android defaults to `versionName 0.1.1` and `versionCode 101`. The release workflow accepts explicit `version_name` and monotonically increasing `version_code` inputs so Play distribution can advance independently without editing generated Android files.

## CI release artifact

Run **Release Android** with the desired version name and code. The workflow installs the locked dependencies, runs the Android quality contract, syncs Capacitor, runs JVM tests and Android lint, then builds both a release AAB and APK. The outputs are retained as a GitHub Actions artifact for 30 days.

The unsigned release output is suitable for reproducibility and acceptance inspection but is not a production Play Store package until it is signed.

## Production signing

Signing credentials must never be committed. A production signing run must provide these environment values from protected CI secrets or a controlled local release environment:

- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

When `ANDROID_KEYSTORE_PATH` is present, Gradle applies the release signing configuration. The keystore itself should be restored to the runner from a protected secret or secure release store before Gradle executes.

## Distribution gate

A production Android release requires: all shared Quality checks green; Android Build green; Release Android green; a signed AAB; installation/device acceptance; authentication and cloud-sync acceptance; native game/app launch fallback acceptance; and Play Console/internal-track validation if Play distribution is selected.

Physical-device and Play Console actions are intentionally collected into the final Phase G acceptance session rather than weakening automated release checks.
