# Android foundation security

The Android build uses only repository source and public build dependencies. No signing key, keystore password, Firebase service-account credential or production publishing token is required for the debug foundation build. Secrets must remain outside source control. Platform-specific capabilities introduced later must use the existing shared platform abstraction rather than exposing unrestricted native interfaces to application code.
