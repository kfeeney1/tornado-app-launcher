# Android foundation acceptance checklist

- Shared React/Vite application remains authoritative.
- Capacitor configuration is committed.
- Capacitor Android/core/CLI versions match and are pinned.
- CI installs with `npm ci`.
- CI builds shared web assets.
- CI generates/synchronizes the Android shell.
- Gradle debug APK compilation passes.
- APK is retained as a workflow artifact.
- No signing keys or Firebase service-account credentials are committed.
- Production publishing remains deferred.
