# Lockfile requirement

`npm ci` is the authoritative dependency installation path in CI. Therefore the committed `package-lock.json` must match `package.json`, including the Capacitor additions. A lockfile mismatch is a real build failure and must be fixed rather than changing CI to `npm install`.
