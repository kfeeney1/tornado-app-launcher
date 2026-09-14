# Stage 7 — Account & Profile Management

## Identity architecture

Firebase Authentication remains the authority for the Tornado account identity and sign-in email. The stable Firebase Auth `uid` owns all private cloud data under `users/{uid}`.

The Firestore root profile remains schema version 1:

```text
users/{uid}
  schemaVersion: 1
  email: string | null
  displayName: string | null
  createdAt: timestamp
  updatedAt: timestamp
```

`users/{uid}.displayName` is the portable Tornado profile value and the account UI source of truth. Firebase Auth is authoritative for `email`; Firestore stores only a convenience mirror.

## Provider awareness

Password-specific controls are shown only when the account includes the `password` provider. Password accounts reauthenticate with the current password before sensitive operations. A future OAuth provider must add its supported reauthentication ceremony for actions that require one.

## Email verification and account changes

Unverified users can continue using the launcher. Profile can send a Firebase verification email and refresh the current verification state. Password accounts can change email using `verifyBeforeUpdateEmail` and can change password after reauthentication. Passwords are never written to Firestore or local storage.

## Sign out

Sign out uses the shared Firebase Auth provider. Account-scoped portable caches remain available for account switching, while genuine device-specific configuration stays local.

## Account deletion architecture

Tornado account deletion intentionally uses Firebase Authentication and Firestore directly. It does **not** require Cloud Functions, Cloud Build, Artifact Registry, Firebase Admin credentials, or a privileged server-side deletion endpoint.

This keeps account lifecycle functionality on the same Firebase client architecture used by the rest of Tornado and avoids adding paid Google Cloud infrastructure solely for account deletion.

### Security boundary

Firestore Security Rules remain the authority for cloud-data access. A signed-in user can delete only documents owned by the same Firebase UID. The client receives no Admin SDK credentials and cannot delete another user's data.

The current account-owned Firestore shape is explicitly known:

```text
users/{uid}
users/{uid}/config/appearance
users/{uid}/config/launcher
users/{uid}/config/preferences
users/{uid}/devices/{deviceId}
```

Root-profile deletion is permitted only when `request.auth.uid == uid`. Config and device deletion keep the same owner-only restrictions.

Because client Firestore deletion is not recursive, any future user-owned subcollection added beneath `users/{uid}` must also be added to the account-deletion helper and covered by security tests. This requirement is deliberate and prevents Tornado from pretending that unknown future data is automatically deleted.

### Recent authentication

Password accounts reauthenticate with the current password before deletion. The deletion helper also refreshes the Firebase ID token and verifies that its `auth_time` is no more than five minutes old. Firebase Auth's own account-deletion API also enforces recent authentication.

A stale session therefore cannot silently perform account deletion.

### Deletion order

The client executes:

```text
recently authenticated user
        ↓
read the current user's device document IDs
        ↓
delete known config documents and device documents
        ↓
delete users/{uid} profile
        ↓
delete the current Firebase Auth identity
        ↓
clear account-owned local cache
        ↓
clean signed-out Tornado state
```

Firestore is removed before Authentication because deleting the Auth identity first could strand private cloud data behind an identity that no longer exists.

Writes are batched below Firestore's batch-size limit. If cloud cleanup fails, Auth deletion is not attempted and local account data is not cleared, so the user remains able to retry.

If Firestore cleanup succeeds but Firebase Auth deletion fails, the account remains authenticated and the operation can be retried; deleting already-missing known Firestore documents is harmless.

## Local cleanup

After confirmed Firebase Auth deletion Tornado removes account-owned local keys for that UID, including portable cache, sync metadata and pending-sync state. Genuine device-level configuration, including the stable installation identity, is intentionally preserved. Deleting an account is not a factory reset of the device.

## Offline behavior

Account deletion is an explicit online-only action. It is never queued for later execution. Network or Firebase errors are surfaced to the user and the account remains recoverable unless the complete cloud cleanup and Auth deletion sequence succeeds.

## Test coverage

Stage 7 covers display-name validation, account email/password validation, provider-aware controls, password changes, profile persistence, local account cleanup, device-state preservation and destructive test-account deletion. Firestore emulator tests protect per-user isolation, while the production deletion implementation relies on the same owner-only rules rather than elevated credentials.

## Deployment prerequisites

Production account deletion requires only the Firebase services already used by Tornado:

- Firebase Authentication;
- Cloud Firestore and its Security Rules;
- Firebase Hosting for the web client.

The normal deployment workflow validates Firestore Rules in the emulator and deploys the rules before Hosting. There is no Cloud Functions deployment step and no requirement to enable Cloud Functions, Cloud Build or Artifact Registry for account deletion.

Email/password Authentication must remain enabled. Firebase Authentication email templates and authorized domains should be reviewed so verification and email-change flows use the intended Tornado branding/domain.

## Data remaining after deletion

The Firebase Auth record and the current known `users/{uid}` Firestore tree are removed. Tornado intentionally retains only genuine device-level local configuration that is not owned by the deleted account. No account-deletion telemetry is introduced.
