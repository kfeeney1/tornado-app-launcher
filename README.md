# Tornado App Launcher

Tornado is a responsive React/Vite launcher for a focused set of apps and games. It uses Tornado branding, supports dark/light appearance modes, local launcher customisation, app discovery, search, Firebase Authentication, profile/settings screens and responsive Playwright coverage.

## Deployment architecture

Tornado uses one live Firebase environment only.

```text
feature branch → Pull Request → Quality CI → main → Firebase Hosting → LIVE
```

- GitHub repository: `kfeeney1/tornado-app-launcher`
- release branch: `main`
- Firebase project: `tornado-app-launcher`
- Hosting build output: `dist`
- Hosting configuration: `firebase.json`
- Firebase project binding: `.firebaserc`
- live deployment workflow: `.github/workflows/deploy-firebase.yml`
- default live URL: `https://tornado-app-launcher.web.app`

There is no TEST Firebase project and no TEST-to-PRODUCTION promotion flow. Changes merged to `main` are deployed to the live Tornado App Launcher after successful checks.

## Prerequisites

- Node.js 22 recommended
- npm

## Run locally

```bash
npm ci
npm run dev
```

Create a production build with `npm run build`; Vite writes output to `dist`.

## Tornado Accounts — Phase 1

Phase 1 establishes identity with Firebase Authentication only. It deliberately does **not** upload or synchronize launcher selections, apps/games, theme, device information or profile data.

The authentication layer lives in `src/auth/AuthContext.jsx` and exposes one shared `AuthProvider` / `useAuth()` abstraction. It provides the signed-in user, loading/authentication state, sign in, registration, sign out and password reset. Firebase authentication state is observed centrally before Tornado decides whether to show the account screens or launcher.

Supported Phase 1 flows:

- email/password registration
- email/password sign in
- Firebase-managed persistent sessions
- password reset email
- sign out
- signed-in email shown in Profile
- deterministic Playwright authentication mode that does not use production Firebase data

Passwords are never written to Tornado localStorage, Firestore or application state. Existing launcher selection and appearance keys remain local to the device and are preserved when users sign in or out.

### Firebase Email/Password provider

The Firebase Authentication **Email/Password** provider must be enabled for project `tornado-app-launcher`:

1. Open Firebase Console → `tornado-app-launcher`.
2. Open **Authentication** → **Sign-in method**.
3. Enable **Email/Password** (passwordless email-link sign-in is not required for Phase 1).
4. Save.

Repository access cannot verify or change that Firebase Console provider setting, so deployment should not be treated as production-ready until this is confirmed manually.

### Firebase client configuration

On Firebase Hosting, Tornado first uses the Hosting reserved config endpoint at `/__/firebase/init.json`, so Firebase client configuration does not need to be committed.

For Capacitor/native builds or other origins, provide the normal public Firebase web-app configuration through Vite variables at build time:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MESSAGING_SENDER_ID
```

These values identify the Firebase web app; they are not Firebase Admin credentials. Never commit service-account JSON or private keys.

For local Firebase Auth Emulator use, set:

```text
VITE_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099
```

The app uses the Firebase Web SDK with Firebase-supported local persistence rather than storing custom auth tokens or passwords.

## Quality and tests

Run the same core checks used by CI:

```bash
npm ci
npm run lint
npm run build
npx playwright install chromium
npm run test:smoke
```

Playwright starts Tornado with a deterministic auth test adapter. The adapter persists only a test-session email, never a password, and prevents CI from depending on uncontrolled production Firebase accounts. Coverage includes signed-out startup, auth navigation, registration, sign in, persistent login, sign out, invalid credentials, neutral password-reset messaging, launcher/settings/profile regressions, browser Back/Forward, game launching and mobile overflow.

## Current functionality

- Tornado account registration, sign in, persistent session, reset email and sign out
- Tornado launcher with up to 5 primary apps and 5 primary games
- live clock and launcher search
- local add/remove launcher entries
- app-store-style catalogue and search
- Settings with persistent dark/light appearance
- Profile with basic signed-in account information
- responsive desktop, tablet and mobile layouts
- localStorage persistence for non-sensitive launcher preferences

Minecraft, Fortnite and other native software entries use their current launch/install fallback behaviour. A browser application cannot install arbitrary native software or increase native-game FPS; OS/game optimisation remains separate from this account phase.

## Firebase Hosting and deployment authentication

Pushes/merges to `main` run lint, the Vite production build and Playwright smoke tests before the deployment job is allowed to run. The deployment explicitly targets Firebase project `tornado-app-launcher` and the Hosting `live` channel.

Deployment authentication uses the repository secret `FIREBASE_SERVICE_ACCOUNT_TORNADO_APP_LAUNCHER`. Keep the service-account JSON only in GitHub Secrets; never commit credentials, private keys or passwords to the repository.

## Android / Capacitor note

The current `main` branch does not contain committed Capacitor/Android project files. The historical `step-5-android-capacitor` branch is behind `main` and contains no unique commits relative to the current launcher. Phase 1 therefore keeps the authentication implementation platform-shared and native-compatible, but an Android package cannot be validated from `main` until Capacitor/Android setup is actually committed.

When a Capacitor build is present, supply the Firebase client variables listed above so authentication does not rely on the Firebase Hosting-only `/__/firebase/init.json` endpoint.

## Phase 1 scope boundary

Not included yet:

- Firestore user profiles
- cloud apps/games configuration
- cross-device preferences or theme sync
- device registry or conflict resolution
- avatars
- Google, Microsoft or Apple sign-in
- subscriptions or parental accounts

Those belong to later phases.

## Future deployments

1. Create a feature branch.
2. Open a Pull Request into `main`.
3. Keep the change unmerged until the Quality workflow succeeds.
4. Merge only work that is ready to become live.
5. The `main` deployment workflow rebuilds and rechecks the application.
6. Firebase Hosting deploys the successful `dist` build to `tornado-app-launcher`.
7. Verify the live site after deployment.

Operational rule: **if a change is not ready to be live, do not merge it into `main`.**
