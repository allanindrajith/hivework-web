# Test Results — Hivework-web

## 1. Existing automated tests

Run with `npm test` (`vitest run`, jsdom) in a fresh clone after `npm ci`.

| Commit | Files | Tests | Passed | Failed | Skipped | Duration |
|---|---|---|---|---|---|---|
| `c66126b` | 4 | 31 | 31 | 0 | 0 | 1.30 s |
| `5551c2a` | 4 | 32 | 32 | 0 | 0 | about 1.5 s |

| File | Tests (`5551c2a`) | Covers |
|---|---|---|
| `src/__tests__/utilities.test.ts` | 9 | `siteConfig`, `cliBuilder`, `navigation`, `clipboard` |
| `src/__tests__/syncCatalog.test.ts` | 4 | `buildCatalog`, `syncCatalog`, `verifyDistHtml` against temp fixtures |
| `src/__tests__/heroStory.test.tsx` | 7 | Header, Hero, Story rendering and copy buttons |
| `src/__tests__/interactiveSections.test.tsx` | 12 | Model matrix, workforce, skills, employees, footer interactions |

**Coverage:** not available. `npx vitest run --coverage` exits 1 with `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'`.

**Why 32 green tests did not catch the main bug:** the tests assert that the site emits the strings it was written to emit. Nothing compares those strings with the real installer. The broken `--skill hive-hire` string is hardcoded in the component and passes straight through.

Type-check (`tsc --noEmit`, strict, `noUnusedLocals`, `noUnusedParameters`) passes at both commits as part of `npm run build`. No broken imports, missing modules or syntax errors were found.

## 2. Temporary audit tests

One file, `src/__tests__/audit.temp.test.ts`, added only to the sandbox copy. A copy is saved as `audit-reports/evidence/audit.temp.test.ts.txt`. It reads the real installer from a clone of the public repo (`AUDIT_PUBLIC_CLONE`).

| ID | Test | Public head `081e103` | Public head `c232a83` | Finding |
|---|---|---|---|---|
| A1 | Every `install.sh` flag hardcoded in components is a real installer flag | FAIL (`--skill`) | FAIL (`--skill`) | HW-001 |
| A2 | Every flag `cliBuilder` can emit is a real installer flag | PASS | PASS | — |
| A3 | Every catalog tool id is accepted by the installer | PASS | PASS | — |
| A4 | Every agent path linked from the site exists in the public repo | FAIL (49 missing) | PASS | HW-009 |
| A5 | Every skill linked from the site exists in the public repo | FAIL (4 missing) | PASS | HW-009 |
| A6 | Every employee on the site exists in the public repo | FAIL (8 missing) | PASS | HW-009 |
| A7 | Runbook docs and runbook agents exist in the public repo | PASS | PASS | — |
| B1 | Bootstrap `cd` target follows a custom repo URL | FAIL | FAIL | HW-014 |
| B2 | Shell metacharacters in a slug are not emitted raw | FAIL | FAIL | HW-015 |
| B3 | Whitespace-only agents produce no `--agent` flag | PASS | PASS | — |
| C1 | `index.html` counts match catalog totals | PASS | PASS | — |
| C2 | `index.html` harness count matches catalog | PASS | PASS | — |
| C3 | `updater.json` notes agree with the catalog agent total | FAIL (296 vs 345) | FAIL | HW-016 |
| D1 | Trailing-slash and unknown paths resolve to a section | PASS | PASS | — |

Totals for the combined suite:

| Web commit | Public head | Total | Passed | Failed |
|---|---|---|---|---|
| `c66126b` | `081e103` | 45 | 38 | 7 |
| `c66126b` | `c232a83` | 45 | 41 | 4 |
| `5551c2a` | `c232a83` | 46 | 42 | 4 |

Tests A1 and A3-A7 are worth keeping as a permanent contract suite; they would have caught HW-001 and HW-009 before publishing.

## 3. CLI execution tests

Full log: `SANDBOX_TEST_LOG.md`.

| Family | Runs | Passed | Failed | Notes |
|---|---|---|---|---|
| Repo scripts (install, test, build, sync, verify, deploy stub, coverage) | 14 | 9 | 5 | Failures: 2 expected (no deps yet), sync without sibling ×2, coverage |
| Per-tool real installs | 17 ×2 heads | 34 | 0 | A first pass of 17 hit the sandbox temp-dir block and is excluded |
| Divisions (dry-run) | 18 ×2 heads | 36 | 0 | One count mismatch at the older head |
| Agent slugs (dry-run) | 345 at old head, 345 at new head | 296, then 345 | 49, then 0 | HW-009 |
| Reviewer slugs | 10 ×2 heads | 0 | 20 | HW-002 |
| Runbooks (real install) | 4 | 4 | 0 | |
| `--skill hive-hire` | 2 | 0 | 2 | HW-001 |
| Flag combinations, symlink mode, `--no-interactive` | 4 | 4 | 0 | |
| Bootstrap one-liner | 4 | 3 | 1 | Second run fails, HW-011 |
| Negative cases | 9 | 8 | 1 | 8 failed safely with clear errors; `--tool` with no value exits 0 |
| `convert.sh --parallel` | 3 | 2 | 1 | The failure is the sandbox temp-dir block |

## 4. Installation, configuration and negative tests

| Test | Result |
|---|---|
| Fresh clone, `npm ci`, `npm test`, `npm run build` | PASS |
| Scripts run before `npm ci` | Fail fast with `command not found` (exit 127) |
| Lockfile integrity (`npm ci`) | PASS, 163 packages |
| Missing sibling repo for sync | FAIL with a clear message |
| Missing env var / bad env var for sync | FAIL with a clear message |
| Sync with env var pointing at a public clone | PASS, no diff |
| Running `verify-dist.mjs` from another directory | PASS |
| Permission failure (unwritable home) on install | FAIL safely, exit 1, clear message |
| Missing `git` | exit 127 |
| Non-bash shell | Syntax error |

## 5. Main failure reasons

1. A hardcoded command string that the installer does not understand (HW-001).
2. A command built for a class of items the installer cannot install (HW-002).
3. Site content published ahead of the repo it points at (HW-009, fixed by a push during the audit).
4. Documentation written for a previous folder layout (HW-007).
5. Environment limits of the audit sandbox (port binding, temp dir). These are not product defects and are marked BLOCKED.
