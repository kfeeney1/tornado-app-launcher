# Debug-only acceptance

Debug APK compilation is sufficient for the build-foundation gate because it proves native project generation, web-asset synchronization and Gradle compilation without requiring irreversible production signing decisions. Release signing is intentionally a separate controlled concern.
