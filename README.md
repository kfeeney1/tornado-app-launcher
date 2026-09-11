# Tornado App Launcher

Tornado is a responsive React/Vite browser launcher for a focused set of apps and games. It uses Tornado branding, supports dark/light appearance modes, local launcher customisation, app discovery, search, profile/settings screens and a focused responsive Playwright smoke suite.

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

## Quality and tests

Run the same core checks used by CI:

```bash
npm ci
npm run lint
npm run build
npx playwright install chromium
npm run test:smoke
```

The focused Playwright suite covers the launcher, Apps/Games, Settings, Appearance, Profile, app discovery/search, add/remove behaviour and mobile overflow. GitHub Actions runs quality checks for pull requests and pushes to `main`.

## Current functionality

- Tornado launcher with up to 5 primary apps and 5 primary games
- live clock and launcher search
- local add/remove launcher entries
- app-store-style catalogue and search
- Settings with persistent dark/light appearance
- local/demo Profile
- startup Tornado animation
- responsive desktop, tablet and mobile layouts
- localStorage persistence for non-sensitive launcher preferences

Minecraft, Fortnite and other native software entries are launcher/demo entries unless a legitimate web destination exists. A browser application cannot install arbitrary native software or increase native-game FPS; OS/game optimisation would require a future desktop architecture.

## Firebase Hosting and authentication

Pushes/merges to `main` run lint, the Vite production build and Playwright smoke tests before the deployment job is allowed to run. The deployment explicitly targets Firebase project `tornado-app-launcher` and the Hosting `live` channel.

Deployment authentication uses the repository secret `FIREBASE_SERVICE_ACCOUNT_TORNADO_APP_LAUNCHER`. Keep the service-account JSON only in GitHub Secrets; never commit credentials, private keys or passwords to the repository.

## Future deployments

1. Create a feature branch.
2. Open a Pull Request into `main`.
3. Keep the change unmerged until the Quality workflow succeeds.
4. Merge only work that is ready to become live.
5. The `main` deployment workflow rebuilds and rechecks the application.
6. Firebase Hosting deploys the successful `dist` build to `tornado-app-launcher`.
7. Verify the live site after deployment.

Operational rule: **if a change is not ready to be live, do not merge it into `main`.**
