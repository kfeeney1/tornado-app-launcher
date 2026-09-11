# Tornado App Launcher

Tornado is a responsive React/Vite browser launcher for a focused set of apps and games. It uses a dark Tornado-branded interface, supports light mode, local launcher customisation, app discovery, search, profile/settings screens and a small responsive smoke suite.

## Prerequisites

- Node.js 22 recommended
- npm

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`; Vite writes output to `dist`.

## Quality and tests

```bash
npm run lint
npm run build
npx playwright install chromium
npm run test:smoke
```

Playwright covers core desktop and Pixel 7-sized mobile journeys. GitHub Actions runs lint, build and the smoke suite for pull requests and pushes to `main`.

## Current functionality

- Tornado launcher with up to 5 primary apps and 5 primary games
- clock and launcher search
- local add/remove launcher entries
- app-store-style catalogue and search
- Settings with persistent dark/light appearance
- local/demo Profile
- startup Tornado animation
- responsive desktop, tablet and mobile layouts
- localStorage persistence for non-sensitive launcher preferences

Minecraft, Fortnite and other native software entries are launcher/demo entries unless a legitimate web destination exists. A browser application cannot install arbitrary native software or increase native-game FPS; OS/game optimisation would require a future desktop architecture.

## Deployment status

Firebase deployment has **not yet been configured**. Step 3 will establish the separate Firebase TEST environment and automatic GitHub → TEST deployment. The planned production deployment remains a later, manual-only flow.

No Firebase projects, service accounts, deployment secrets or Firebase workflows are part of Step 2.
