# Phase C PR gate checklist

- Branch created from verified Phase B merge commit.
- Desktop shell and shared navigation inspected before changes.
- Existing architecture reused; no Windows-only React app.
- Desktop lifecycle/security/parity regression coverage added.
- Deferred real-Windows acceptance recorded separately from automated evidence.
- Required Quality CI must pass before merge.
- Merge only after green CI.
- Re-inspect `main` after merge before starting Phase D implementation.
