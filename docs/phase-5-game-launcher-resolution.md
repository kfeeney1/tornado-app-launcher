# Phase 5 — Game and launcher resolution

Starting `main`: `f67dba6977a442a7c76439e60ca55914acf1883f`.

## Scope

Phase 5 resolves only games present in the live Tornado catalogue: Minecraft, Fortnite and Roblox. Steam support is not added because no current catalogue game requires it.

## Architecture

`Tornado game ID → shared launch service → Windows game resolver → local install evidence → restricted native launch or official install fallback`

The renderer sends stable Tornado IDs. Windows-specific evidence collection stays behind preload/validated IPC. Launch execution remains the Phase 3 allowlisted native-launch path.

## Resolution evidence

### Minecraft

Minecraft is considered installed only when Phase 4 bounded discovery finds a matching Minecraft/Minecraft Launcher Start Menu registration.

### Roblox

Roblox is considered installed only when Phase 4 bounded discovery finds a matching Roblox Player registration.

### Fortnite

The Epic Games Launcher shortcut is not sufficient evidence that Fortnite is installed. Tornado inspects only Epic's documented local manifest directory beneath `PROGRAMDATA/Epic/EpicGamesLauncher/Data/Manifests` and looks for a bounded set of small `.item` JSON manifests matching Fortnite by display/app/catalog identity.

The manifest reader:

- has a 200-entry maximum
- ignores non-`.item` files
- refuses manifest files larger than 512 KiB
- ignores malformed/stale JSON
- does not expose manifest paths or installation directories to React

## Installed state and launch behaviour

Catalogue metadata never implies `Installed`.

When Windows has positive evidence:

- the launcher card can show `Launch`
- Tornado uses the existing allowlisted registered protocol
- a protocol/launcher error falls back to the official catalogue install destination

When Windows has negative evidence:

- the launcher card shows `Install`
- Tornado does not attempt native launch
- Tornado opens the existing official install destination

Current official catalogue fallbacks are Minecraft's official download page, Fortnite's official download page and Roblox's official download page.

## Security and privacy

The game-resolution IPC accepts only a Tornado game ID. Unknown IDs are rejected. Resolution results exposed to shared React contain only:

- `appId`
- `installed`
- a small allowlisted launcher identifier

No executable path, install directory, Windows username, registry value, manifest path, command line or arbitrary protocol is returned or synced.

## Failure handling

Stale registrations and broken protocols remain safe: a native launch failure does not execute an alternative command and instead uses the official fallback URL. Missing launchers/games never produce a false Installed state.

## Tests

Deterministic tests cover:

- installed and missing Minecraft/Roblox evidence
- Fortnite manifest evidence versus Epic Launcher-only evidence
- unknown games
- bounded Epic manifest location
- adapter privacy sanitization
- missing-game install fallback without native launch
- stale native launch fallback

Existing CI continues to validate lint, unit tests, Electron/platform security tests, Web build, Firebase emulator rules tests, Playwright and Windows package build.

## Deferred

Persistent local resolution cache, manual path selection and stale-path repair belong to Phase 6. Desktop window/product integration belongs to Phase 7.
