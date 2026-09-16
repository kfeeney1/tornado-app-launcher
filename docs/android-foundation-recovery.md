# Android build recovery

When CI fails, use the failing workflow job and step logs as the source of truth. Repair dependency, Capacitor, Android SDK or Gradle configuration on this branch and allow a fresh PR run. Do not bypass the failure by removing the APK build, changing it to continue-on-error, or merging red checks.
