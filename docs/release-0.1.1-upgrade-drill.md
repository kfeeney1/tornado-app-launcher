# Tornado v0.1.1 upgrade drill

This patch release exists to exercise the Phase 9 production upgrade and rollback lifecycle against the published v0.1.0 Windows release.

The production exercise is:

1. Build v0.1.1 through the normal protected-branch PR and CI path.
2. Create a draft Windows release candidate from the merged main commit.
3. Install the v0.1.1 candidate over an existing production v0.1.0 installation.
4. Verify authentication, cloud sync, device-local configuration, app discovery, native app launch, game launch, Settings/About version reporting, diagnostics, restart persistence, and reinstall behaviour.
5. Verify recovery by retaining the immutable v0.1.0 production installer and documenting/rehearsing the known-good reinstall path.
6. Promote the exact tested v0.1.1 candidate assets to stable without rebuilding them.

No automatic executable update is enabled by this patch. Windows code signing remains an external production prerequisite for trusted automatic installation.
