# Phase C CI handling

The Phase C PR is not complete merely because it opens successfully. Monitor every required Quality job. If a required job fails, inspect the failing job/logs, diagnose the underlying product/test/build issue, commit the fix to the same Phase C branch, and allow CI to rerun. Repeat until green.

Only then merge. Do not bypass, disable or weaken a required check to progress the roadmap.
