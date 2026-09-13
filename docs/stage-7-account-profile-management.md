# Stage 7 — Account & Profile Management

## Identity architecture

Firebase Authentication remains the authority for the Tornado account identity and sign-in email. The stable Firebase Auth `uid` continues to own all private cloud data under `users/{uid}`.

The Firestore root profile remains schema version 1:

```text
users/{uid}
  schemaVersion: 1
  email: string | null
  displayName: string | null
  createdAt: timestamp
  updatedAt: timestamp
```

`users/{uid}.displayName` is the portable Tornado profile value and the account UI source of truth. When the user edits it, Tornado updates Firestore and mirrors the same value to Firebase Auth `displayName`. There is no username, public profile, uniqueness requirement, or second display-name namespace.

Firebase Auth is authoritative for `email`. The Firestore profile email is only a convenience mirror. Tornado synchronizes that mirror from Auth after Auth reports the current address; it never changes Firestore email optimistically before an Auth email operation succeeds.

## Provider awareness

The account UI reads Firebase Auth provider IDs. Password-specific controls are shown only when the account includes the `password` provider. Stage 7 does not add OAuth providers. A provider that cannot use password reauthentication therefore does not receive Change Email or Change Password controls.

The delete backend is provider-neutral, but the current Stage 7 client can perform the required recent-login reauthentication only for password accounts. A future OAuth provider must add that provider's supported reauthentication ceremony before enabling deletion from that provider's UI.

## Email verification

Unverified users can keep using the launcher. Profile shows the verification state in text and offers:

- **Send verification email**, implemented with Firebase Auth `sendEmailVerification`.
- **I've verified my email**, which calls Firebase Auth `reload` and refreshes account state.

Verification failures and throttling are mapped to user-facing messages rather than raw Firebase errors. Verification is not queued offline.

## Changing email

Password accounts use this sequence:

1. validate the proposed email locally;
2. reauthenticate the current account with `EmailAuthProvider.credential` and `reauthenticateWithCredential`;
3. call Firebase Auth `verifyBeforeUpdateEmail(user, newEmail)`;
4. keep the existing sign-in email until Firebase completes the verification-before-update flow;
5. when Firebase Auth subsequently reports the new email, synchronize the convenience Firestore profile email.

The UID does not change, so cloud config, devices, migration ownership and sync ownership remain attached to the same account.

## Password management

Password accounts can change password by entering current password, new password and confirmation. Tornado validates required fields, an 8-character minimum consistent with the existing product policy, and confirmation matching. It then reauthenticates and calls Firebase Auth `updatePassword`.

The existing signed-out Forgot Password flow remains unchanged. A signed-in password user can also request a reset email from Profile.

Passwords are never written to Firestore, localStorage, analytics, console logs or Tornado telemetry.

## Sign out

Sign out still uses the single Stage 1 Auth provider. Losing `user` unmounts the Stage 4 Sync provider and Stage 6 Device provider, which stops their listeners/activity. Account-scoped portable caches remain available for safe account switching, while device-specific configuration remains local.

## Account deletion architecture

Stage 7 deliberately does **not** loosen Firestore Rules. The existing root profile rule still rejects client deletion. Complete deletion is performed by the callable Cloud Function `deleteTornadoAccount` using Firebase Admin SDK privileges only in `functions/`.

The client never receives Admin credentials.

### Reauthentication

For the current email/password provider, the client reauthenticates with the current password before calling the function. The function independently checks the authenticated ID token and requires `auth_time` to be no more than five minutes old. A stale long-lived session therefore cannot invoke deletion successfully.

### Deletion order

The backend executes:

```text
recently authenticated user
        ↓
recursive delete users/{uid}
        ↓
delete Firebase Auth user uid
        ↓
return success
        ↓
client clears account-owned local cache
        ↓
clean signed-out Tornado state
```

Firestore is deleted first because deleting Auth first would remove the user's identity while leaving account-owned cloud data behind. Admin SDK `recursiveDelete(users/{uid})` removes the root profile and every current or future nested account-owned document, including:

- `users/{uid}/config/appearance`
- `users/{uid}/config/launcher`
- `users/{uid}/config/preferences`
- `users/{uid}/devices/{deviceId}`

It does not touch global Tornado catalogue data or another UID.

### Partial failure and retry safety

The workflow is intentionally retryable rather than pretending the two Firebase products can be changed atomically.

- If Firestore recursive deletion fails, Auth deletion is not attempted. The account stays signable and the user can retry.
- If Firestore succeeds but Auth deletion fails, the function reports failure. Retrying is safe because recursively deleting an already-empty user tree is harmless, after which Auth deletion is attempted again.
- If the Auth user is already absent when the backend reaches Auth deletion, deletion is treated as complete.
- Account-owned local data is not cleared until the server call returns success. This preserves recovery information if the server operation fails.

## Local cleanup

After confirmed server deletion Tornado removes account-owned keys for that UID, including:

- `tornado-account-portable-v1:{uid}`
- `tornado-account-portable-meta-v1:{uid}`
- `tornado-sync-pending-v1:{uid}`
- matching legacy account-ownership metadata

Test-mode account/profile/device/cloud keys are also cleared by the deterministic test adapter.

Tornado intentionally preserves genuine device-level state, including `tornado-device-config-v1` and its stable installation ID. Deleting an account is not a factory reset of the client device.

## Firestore security

Stage 7 does not broaden client rules. Users can still read/write only their own `users/{uid}` hierarchy, configuration and device records. Root profile deletion remains denied from client SDKs; the trusted deletion function bypasses client rules through Admin SDK.

## Offline behavior

Launcher use and existing local-first Stage 4 behavior remain available offline. Sensitive account operations are explicit online actions and are never silently queued. Delete Account checks connectivity before submitting; Firebase Auth/Functions network failures are surfaced with retryable messages.

## Test coverage

Stage 7 adds deterministic unit and Playwright coverage for:

- display-name normalization and validation;
- email/password validation;
- provider-aware password controls;
- account-local cleanup while preserving device configuration;
- display-name persistence across reload;
- a second signed-in client loading the updated profile;
- verification-email action without blocking launcher use;
- password change followed by proof that the old password fails and the new password succeeds;
- isolated test-account deletion, account-local cleanup and preservation of device identity.

Existing Firestore Rules tests continue to protect owner isolation. Destructive browser tests create their own dedicated test account and never target production users.

## Deployment and manual prerequisites

Stage 7 adds Firebase Functions source under `functions/` and configures the Functions emulator. Production account deletion requires `deleteTornadoAccount` to be deployed to Firebase project `tornado-app-launcher`.

The deployment identity must have the Firebase/Google Cloud permissions required to deploy Cloud Functions, and the Firebase project must be on a plan that supports Cloud Functions. If the current GitHub service account cannot deploy Functions, grant the minimum required deployment roles or deploy the function using an authorized operator. Do not copy Admin credentials into the web app.

Email/password Authentication must remain enabled. Firebase's Authentication email templates and authorized domains should be reviewed so verification and verify-before-update emails use the intended Tornado branding/domain.

## Data remaining after deletion

Tornado intentionally retains only device-level local configuration that is not owned by the deleted account. The account's Firebase Auth record and `users/{uid}` Firestore tree are intended to be removed. No Stage 7 analytics or new telemetry is introduced.
