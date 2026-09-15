# Phase C PR evidence

Start SHA: `f2912cfe5486fb0af9c1ba3115c8af32c385c43f`.

Inspection found the required desktop fundamentals already in the shared Electron shell, so this PR hardens the product through explicit lifecycle/security/native-boundary contracts, shared Playwright navigation regression, Web-regression requirements, and a consolidated deferred-Windows acceptance register.

No Windows-only React application, tray/startup/notification framework, updater redesign, telemetry or arbitrary native access is introduced.

Required CI must be monitored and fixed until green before merge. Real Windows execution remains deferred and release blocking.
