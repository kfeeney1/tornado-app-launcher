# Work Block 2 evidence

The pull request Actions checks are the authoritative automated evidence for this block. Merge requires the existing Quality gate plus the Android Build debug APK job to succeed. The uploaded `tornado-android-debug` artifact is build evidence, not a production release.

If the Android Build job fails, inspect the failing Actions job/logs and repair the same branch rather than weakening or removing the build gate.
