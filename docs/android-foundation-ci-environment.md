# Android CI environment

The foundation workflow uses Ubuntu, Node 22, Temurin Java 21 and the GitHub Android SDK setup action. The Gradle wrapper produced by Capacitor's Android template is responsible for the native build toolchain. Environment changes should be justified by actual build evidence rather than speculative upgrades.
