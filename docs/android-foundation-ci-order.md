# CI order

Dependency installation precedes web compilation; web compilation precedes Capacitor generation/sync; native sync precedes Gradle compilation; artifact upload occurs only after compilation succeeds. This ordering ensures the APK contains the current shared application build.
