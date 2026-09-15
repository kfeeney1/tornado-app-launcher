# Phase C test plan

Automated PR validation must retain the repository Quality workflow and its Windows desktop job. Phase C-specific tests are intentionally lightweight source/contract checks plus shared Playwright navigation regression, because GitHub Actions cannot establish subjective Windows shell behaviour on the product owner's machine.

When Windows access returns, execute the Phase C entries in `docs/windows-deferred-acceptance.md` against the packaged artifact generated from the accepted commit. Record failures as product defects; do not reinterpret CI package success as equivalent evidence.
