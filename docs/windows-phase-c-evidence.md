# Phase C evidence hierarchy

1. Live repository implementation is authoritative for what Tornado currently does.
2. Required GitHub Actions checks are authoritative for automated regression/build status.
3. Windows CI package construction proves buildability, not successful end-user interaction.
4. Real packaged Windows execution is authoritative for native desktop acceptance.

This prevents documentation or historical phase claims from outranking the actual code and prevents CI packaging from being mistaken for real-machine acceptance.
