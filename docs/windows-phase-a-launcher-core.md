# Windows Phase A — Launcher Core

Starting `main`: `173d92cc2765e4eb63ea83899440aa4d08309757`

## Live-state finding

Tornado already had bounded Start Menu discovery, game evidence for Minecraft/Fortnite/Roblox, a restricted preload/IPC bridge, allowlisted native game protocols, device-local resolution caching and Web/install fallbacks. The material launcher gap was that Spotify, Discord and Notion could be discovered as installed Windows apps but still resolved only to Web URLs.

## Launcher lifecycle

Phase A converges supported targets around:

`catalogue item -> local evidence -> native target -> launch -> failure invalidation -> rediscovery -> one retry -> safe fallback`

### Windows applications

Spotify, Discord and Notion use the existing bounded Start Menu discovery roots. If a matching `.lnk` exists, Electron main resolves that shortcut locally and opens it through `shell.openPath`. The renderer sends only the stable Tornado ID plus target type; it never supplies a filesystem path or command.

If the app is not installed, Tornado opens the existing Web destination. If native launch fails, cached resolution state is invalidated, discovery is refreshed once and Tornado retries once before falling back to Web.

Browser and YouTube remain Web targets because Tornado has no product requirement to bind them to arbitrary local browsers/app packages.

### Games

Minecraft, Fortnite and Roblox retain the existing evidence model and allowlisted protocol targets. A failed native launch now invalidates the cached resolution, performs a fresh game resolution and retries once when current evidence still says the game is installed. If current evidence says it is missing, Tornado opens the official install destination.

## Security boundary

- no arbitrary renderer-supplied executable paths
- no command strings or shell execution
- only `spotify`, `discord` and `notion` may use the installed-app shortcut path
- shortcuts are resolved in Electron main from bounded Start Menu roots
- only `.lnk` records are eligible for native app launch
- existing game protocols remain allowlisted in Electron main
- Web/cloud state contains stable catalogue IDs, not local Windows shortcut paths

## Automated coverage

Phase A adds/updates coverage for:

- Web versus Windows launch-target resolution
- allowlisted installed-app resolution
- renderer path/command rejection
- installed app native launch
- missing app Web fallback
- stale app rediscovery/retry
- stale game invalidation/rediscovery/retry
- missing game official install fallback

Existing Electron security, local/cloud isolation, discovery, game-resolution and Web smoke tests remain required.

## Packaged acceptance still required

CI can build and start the packaged Windows application, but it cannot prove third-party software launches on the user's actual machine. Before Phase A may be declared complete, manually verify from a production-style packaged build:

1. installed Spotify, Discord or Notion launches natively;
2. one installed supported game launches;
3. one missing supported game opens the official install destination;
4. a stale target can be repaired/rediscovered;
5. Web/cloud configuration contains no Windows path or shortcut data.

Do not begin Phase B until those checks are recorded and the Phase A PR is merged and `main` reverified.
