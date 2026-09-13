# Stage 5 — Existing setup migration and conflict resolution

Stage 5 adds a reconciliation gate in front of the Stage 4 realtime synchronization engine. Realtime cloud listeners are not started until Tornado has established that initial synchronization is safe for the signed-in account on this device.

## Decision table

| Local state | Cloud state | Behaviour |
| --- | --- | --- |
| Missing/fresh | Missing | Create the normal default portable configuration, initialize the account cloud documents, then start Stage 4 sync. |
| Existing legacy/account setup | Missing | Preserve local portable configuration, initialize cloud from it, mark this account/device cache reconciled, then start Stage 4 sync. |
| Fresh/default | Existing | Load established cloud portable configuration automatically. Device-only configuration is untouched. |
| Existing | Equivalent | Do not prompt. Seed any genuinely missing cloud domain, mark reconciliation complete, then start normal sync. |
| Existing | Different | Pause cloud synchronization and show the setup reconciliation dialog. Nothing is overwritten until the user chooses. |
| Other user's cache | Existing or missing | Never reuse or upload it. Create a fresh account-scoped cache for the new UID and reconcile that account independently. |
| Any | Malformed/unsupported cloud schema | Block reconciliation and preserve local data. Do not interpret the cloud document as missing. |
| Unreconciled | Offline | Keep the local launcher usable, do not overwrite unknown cloud state and do not mark reconciliation complete. Retry when connectivity returns. |

## Local state and ownership

Portable account caches are keyed by Firebase UID (`tornado-account-portable-v1:<uid>`). Stage 5 adds account-aware metadata (`tornado-account-portable-meta-v1:<uid>`) containing the owning UID, the local source (`fresh`, `legacy`, or `account`) and whether initial reconciliation completed successfully.

The previous global pre-account portable configuration is treated as legacy user data when it contains meaningful non-default state. It may be claimed only by the first account. Once another UID has claimed that legacy setup, later accounts receive a fresh account cache instead of inheriting the first user's launcher.

Device configuration remains under the Stage 3 device boundary and is never copied into cloud account documents.

## Fresh/default versus deliberately empty

A missing local portable record is fresh. The exact stock Tornado defaults with no older legacy keys are also treated as an uninitialized/fresh installation so a new device can hydrate from an established account without a false conflict.

An explicitly empty launcher (`selectedItemIds: []`) is not the stock default and is therefore meaningful existing configuration. Missing is never represented as an empty launcher.

## Normalization and comparison

Reconciliation validates portable schema first and compares only portable concepts:

- launcher stable Tornado IDs, including order;
- portable appearance theme;
- portable preferences.

Storage metadata, timestamps, account ownership metadata, native installation state, executable/package launch information and other device-only configuration are excluded. Stable but currently unknown catalogue IDs remain valid and are preserved; the review UI falls back to the stable ID when a display name is not present in the current catalogue.

## Conflict choices

### Use account setup

Tornado keeps the established account configuration for every existing cloud domain and fills only genuinely missing cloud domains. The resulting portable setup replaces the local account cache. Device configuration is unchanged.

### Use this device

Tornado writes the complete local portable configuration to the account using one Firestore batch. Only after that batch succeeds is reconciliation marked complete and Stage 4 sync started. A concise confirmation explains that the previous cloud launcher will be replaced and other signed-in clients will receive the change.

Stage 5 deliberately does not offer a combine option because launcher ordering, appearance precedence and removal semantics would make an automatic union misleading.

## Failure and interruption recovery

Reconciliation completion is written only after the intended cloud operation succeeds. If a network, authentication, permission or schema failure occurs, the account remains unreconciled. On restart Tornado performs the reconciliation check again and can retry safely.

Replacing the account setup uses a Firestore batch so appearance, launcher and preferences are committed together. Initial seeding of missing domains uses the same batch mechanism. In test mode all values are validated before the test backend updates its simulated cloud records.

## Stage 4 integration

The initialization order is:

1. Authentication resolves the UID.
2. Tornado loads only that UID's portable cache ownership state.
3. Stage 5 reads and classifies cloud portable domains.
4. Safe automatic cases are reconciled, or a meaningful conflict is shown.
5. Reconciliation completion is persisted only after required writes succeed.
6. Stage 4 realtime listeners start.

After reconciliation, the existing Stage 4 pending-domain/offline behaviour remains authoritative. Pending local changes are protected during normal initialization, and remote changes continue to flow through the Stage 4 listeners.

## Platform behaviour

The reconciliation code is platform-neutral. Android keeps installed-app state, native launch targets and permissions in device configuration. Web clients keep browser-local device configuration. A future Windows client can use the same account reconciliation model without adding Windows-specific values to Firestore.
