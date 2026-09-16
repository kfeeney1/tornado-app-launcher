# Android foundation CI contract

A successful Work Block 2 run must execute a clean dependency install, compile the shared web application, create/synchronize the Capacitor Android project, invoke Gradle's debug assembly task and retain the resulting APK. A workflow that checks only configuration files does not satisfy the build-foundation acceptance gate.
