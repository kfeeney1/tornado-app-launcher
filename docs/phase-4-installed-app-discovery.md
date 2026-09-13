# Phase 4 — Windows installed app discovery

Starting `main`: `1aea631be7cd6d3c6008931cbf0653e5e558f452`.

## Scope

Phase 4 adds bounded, privacy-conscious Windows installed-app discovery behind the shared Tornado platform layer. It does not scan the filesystem recursively and does not upload installed-software information.

## Architecture

`React → installedAppsService → Windows adapter → preload → validated IPC → bounded Start Menu discovery`

Shared React never reads Windows directories directly. Electron main owns the Windows-specific discovery operation.

## Discovery source

The current implementation inspects only Windows Start Menu registration locations:

- the current user's `Microsoft/Windows/Start Menu/Programs`
- the system-wide `Microsoft/Windows/Start Menu/Programs`

The scan is bounded by a maximum depth and entry count, skips symbolic links, and considers only shortcut-like `.lnk` / `.url` entries. It does not recursively scan drives, Program Files, user profiles, registries, or arbitrary directories.

## Tornado identity matching

Shortcut display names are normalized and matched to stable Tornado catalogue IDs. Current aliases cover catalogue applications that can be identified reliably from Start Menu entries, including Spotify, Discord, Notion, Minecraft Launcher and Roblox Player.

Executable filenames and shortcut names are not treated as Tornado identity. Matching output is reduced to:

`{ appId, source }`

Duplicate shortcuts collapse deterministically to one Tornado ID.

Fortnite game-install evidence is intentionally deferred to Phase 5 because the Epic Games Launcher shortcut alone does not prove that Fortnite itself is installed.

## Privacy boundary

Discovery results exposed to shared React contain no:

- executable paths
- shortcut paths
- Windows usernames
- registry keys or values
- raw installed-software inventory
- command strings

Nothing in this phase writes discovery results to Firestore or portable account configuration.

## UX

Where Windows discovery is available, launcher cards can distinguish locally installed catalogue entries. Native protocol games show `Launch` when positively matched and `Install` when not matched; web-capable apps remain usable through their existing web destination and may show `Installed · Web` when locally detected.

Discovery evidence does not replace safe launch failure handling. A stale or incomplete discovery result cannot grant arbitrary execution.

## Tests

Deterministic unit coverage verifies:

- shortcut normalization and Tornado-ID matching
- unknown/malformed entry handling
- duplicate suppression
- bounded Start Menu roots
- adapter sanitization of bridge results
- no path/username leakage through the shared platform result
- shared discovery cache behaviour
- unsupported-Web behaviour

Existing CI continues to cover lint, shared unit tests, Electron security/platform tests, Web build, Firebase emulator rules tests, Playwright, and Windows packaging.

## Deferred

- Epic/Microsoft/Steam game ecosystem resolution: Phase 5, only where the live catalogue requires it
- persistent device-local discovery/launch cache and manual resolution: Phase 6
- desktop experience improvements: Phase 7
