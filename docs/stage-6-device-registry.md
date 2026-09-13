# Stage 6 — Device Registry & Account Device Management

## Architecture

Each Tornado installation has a locally generated UUID stored inside the existing device-specific configuration (`tornado-device-config-v1`). It is not part of portable configuration and is not synchronized between installations.

Authenticated installations register at:

`users/{uid}/devices/{deviceId}`

The registry is account metadata only. Portable launcher configuration and device-specific launch targets remain separate.

## Device record schema

```text
schemaVersion: 1
deviceId: string
platform: web | android | windows | unknown
deviceName: string
clientType: string
appVersion: string | null
createdAt: Timestamp
lastSeenAt: Timestamp
```

`createdAt` is established on the first successful registration and preserved by later registrations. `lastSeenAt` is updated on startup/sign-in after Stage 5 reconciliation and when the app becomes active again. In-session writes are throttled to at most once every 15 minutes unless an explicit startup registration is required.

## Device identity

The installation ID is generated locally using `crypto.randomUUID()` and persisted in device-local configuration. It contains no account information or hardware identifier. Clearing browser storage or reinstalling a native app can generate a new installation ID; an older registry entry can remain until the user removes it.

The same installation ID may appear under more than one account when people sign into different accounts on the same Tornado installation. Firestore ownership is still isolated because each record lives below its account UID.

## Platform and naming

Native-capable clients use the available Capacitor platform abstraction when present. Web clients remain `platform = web`; a friendly label such as `Chrome on Windows` may use ordinary user-agent information only for presentation. No fingerprinting, serial number, IMEI, advertising identifier, IP history, or location is collected.

The application version is injected from the package version during the Vite build so version metadata has one source of truth.

## Profile and removal semantics

Profile includes a Devices section. The local installation is identified by exact device ID and is labelled `This device`. Devices sort with the current installation first and then by most recent activity.

Old entries can be removed with `Remove from device list`. Removing a registry entry deletes only `users/{uid}/devices/{deviceId}`. It does **not** revoke Firebase Authentication credentials or force a remote client to sign out. The current installation is not offered a remove action; the Account section continues to provide Sign Out.

True remote session revocation is **not supported in Stage 6**. Tornado currently has no trusted Admin-SDK backend for targeted session revocation, and privileged credentials are not added to the client.

## Account switching and sign-out

The registry provider is mounted only for the currently authenticated user and only registers after Stage 5 reconciliation completes. On sign-out/account change it unmounts, stops account-specific device activity, and preserves the installation ID and other genuine device-local configuration. A different account receives its own record below its own UID.

## Offline behaviour

Registry writes are secondary to launcher operation. If Tornado is offline, device registration/last-seen updates wait and registry loading can fail without blocking the launcher or Stage 4 local-first sync behaviour.

## Firestore security

Rules allow only the authenticated owner to read, list, create, update or delete their device documents. Device writes are schema-constrained, the document ID must equal `deviceId`, and updates cannot change `createdAt` or the record identity.

## Privacy

Stored device metadata is limited to installation ID, platform, user-facing device name, client type, Tornado app version, first registration time, and last active time. The device registry is not analytics or telemetry infrastructure.
