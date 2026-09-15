# Phase C desktop security boundary

Phase C retains the existing Electron security model. Renderer code is shared React code and does not receive raw Node.js, filesystem or shell access. Native operations remain explicit preload/IPC capabilities and are validated in the main process.

The BrowserWindow keeps context isolation, disables Node integration, enables the sandbox and web security, denies renderer-created windows, and prevents arbitrary top-level navigation. External URLs are restricted to the established HTTP/HTTPS/mail allowlist. Native application launch remains subject to the Phase A target validation and allowlists.

Desktop-experience work must not weaken these constraints for convenience.
