# Android foundation dependencies

Capacitor core, Android and CLI are kept on the same pinned version so native generation and runtime APIs remain aligned. The existing non-Android dependency rationalisation is outside this packaging block; the Android additions must nevertheless be reflected in the npm lockfile before the CI build can be accepted.
