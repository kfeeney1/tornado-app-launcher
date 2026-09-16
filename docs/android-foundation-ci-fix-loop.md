# CI fix loop

For every failing PR run: identify the failed workflow/job/step, read the logs, make the smallest root-cause fix on `work-block-2-android-build-foundation`, then evaluate the new run. Repeat until the complete gate is green; do not merge a partially green run.
