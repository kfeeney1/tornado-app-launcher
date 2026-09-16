# Native source-control strategy

The first CI build generates the Capacitor Android project from pinned tooling and committed configuration. This avoids hand-authoring an unverified Gradle skeleton. Once the generated project is known to compile, the project can be reviewed and source-controlled as appropriate for ongoing native development. Generated build output itself must never be committed.
