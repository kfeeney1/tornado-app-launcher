# Phase C acceptance matrix

| Behaviour | Automated evidence | Real Windows evidence |
| --- | --- | --- |
| Single instance | Electron contract tests | Deferred |
| Restore/focus | Electron contract tests | Deferred |
| Local window geometry | lifecycle/contract tests | Deferred |
| Off-screen recovery | lifecycle/contract tests | Deferred |
| Minimum size | lifecycle/contract tests | Deferred |
| Ready-to-show | contract tests | Deferred |
| Shared navigation | Playwright Web regression + source contract | Deferred packaged confirmation |
| External navigation restrictions | source/security tests | Deferred smoke |
| Electron security | security tests | N/A beyond packaged regression |
| Windows packaging | Windows CI job | Deferred install/run |

Deferred means unexecuted, not passed.
