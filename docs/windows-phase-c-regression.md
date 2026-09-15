# Phase C Web regression requirement

Desktop hardening must preserve Tornado Web. Shared navigation, account, launcher, sync and catalogue behaviour remain shared code. Phase C must not introduce Electron globals into ordinary React components beyond the existing platform abstraction.

The existing Quality Playwright suite remains the primary Web regression gate; Phase C adds navigation regression coverage to ensure desktop-oriented lifecycle work does not break shared view transitions or launcher state.
