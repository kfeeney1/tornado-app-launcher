# Clean-build requirement

The Android CI job starts from a clean checkout. It must not rely on a developer's Android Studio state, globally installed Capacitor CLI, cached native project, local signing material or manually copied web assets. This is the core reproducibility requirement for Work Block 2.
