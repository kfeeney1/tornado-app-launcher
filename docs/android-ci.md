# Android CI

`Android Build` is the authoritative foundation build for the Android client. It runs on pull requests to `main` and after merges to `main`.

The job uses Node 22, Java 21 and the Android SDK, installs the repository dependency graph with `npm ci`, builds the shared Vite application, generates/synchronizes the Capacitor native project, and runs Gradle `assembleDebug`. A successful job uploads `app-debug.apk` as `tornado-android-debug`.

A green configuration-only check is not sufficient to merge this work block; the APK build itself must pass.
