# Work Block 2 — Android Build Foundation

Status: in progress.

This work block establishes a reproducible Android build from the shared Tornado React/Vite codebase. Acceptance requires a pull request build that installs dependencies from the repository lockfile, builds the web application, creates/synchronizes the Capacitor Android project, compiles a debug APK, and publishes it as a CI artifact.

The current foundation deliberately does not introduce production signing, Play Store publishing, Android-specific duplicate product logic, or Firebase credentials.

Any CI failure in this block must be diagnosed and fixed on the same branch before merge.
