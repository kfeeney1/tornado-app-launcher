# Phase C desktop review

Starting SHA: `f2912cfe5486fb0af9c1ba3115c8af32c385c43f`

## Review outcome

No large desktop-shell rewrite is justified. The live Electron shell already implements the required Phase C fundamentals: single-instance behaviour, focus/restore, device-local validated window state, minimum bounds, delayed show, controlled external navigation, secure webPreferences, local diagnostics and normal Windows close semantics.

The shared React application already distinguishes desktop Back behaviour from the Web exit-confirmation boundary while retaining the same navigation implementation for both clients.

Accordingly Phase C focuses on making those behaviours explicit acceptance contracts and strengthening regression coverage rather than introducing speculative tray/startup/notification functionality.

## Known acceptance debt

Real packaged Windows shell behaviour cannot currently be exercised by the product owner. The authoritative list is `docs/windows-deferred-acceptance.md`. CI/package success is not a substitute for those checks.
