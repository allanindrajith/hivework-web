# Repository Audit Report — Hivework-web

Audit date: 2026-11-13
Commits audited: `c66126b` (start), re-verified at `5551c2a` (three commits landed during the audit)
Companion files: `CLI_COMMAND_INVENTORY.md`, `TEST_RESULTS.md`, `BUG_REPORT.md`, `AGENT_COMPATIBILITY.md`, `SANDBOX_TEST_LOG.md`, `evidence/`

Status vocabulary: PASS, FAIL, PARTIAL, UNTESTED, NOT IMPLEMENTED, BLOCKED.

---

> **Update after fixes:** 17 of 21 findings are fixed or guarded, 3 need action outside this repo (HW-005 release asset, HW-006 signing, HW-021 manual check), 1 is partly fixed (HW-016). Per-finding status: `BUG_REPORT.md` → "Fix status". The sections below describe the state at audit time.

## 1. Executive Summary

The repository builds, type-checks and passes its own tests on a clean machine. As a codebase it is healthy.

As a product surface it has one break that matters: the Employees section tells every visitor to run `./scripts/install.sh --skill hive-hire`, and the installer rejects that flag. The headline "8 AI Employees" feature has no working install command on the site. A second, smaller break affects all 10 reviewer cards.

Answer to the audit question — a new user following the site today:

| Journey | Outcome |
|---|---|
| Install agents for any of 17 tools | Works (17/17) |
| Install a division (18) or hand-picked agents (345) | Works |
| Install a runbook team (4) | Works |
| Install skills | Works for 5 tools; cleanly skipped for 12 |
| Install a reviewer (10) | Fails: `Unknown agent` |
| Install hive-hire as instructed | Fails: `Unknown option: --skill` |
| Use the one-line bootstrap for Cursor, OpenCode, Qwen, Aider, Windsurf | Runs, but installs into the wrong folder |
| Re-run the one-line bootstrap | Fails: folder already exists |
| Download the desktop app | File downloads; it is not code-signed |
| Contribute to this repo using its docs | Fails at `cd app`; no README |

Counts: 21 findings — 1 HIGH, 9 MEDIUM, 11 LOW. No CRITICAL findings: no destructive commands, no exposed secrets.

Two things changed while the audit ran, and both are reflected here. The public `hivework` repo was 49 agents, 4 skills and 8 employees behind the site until a push at 01:15; and this repo gained a desktop-app download in three new commits.

## 2. Repository Overview

| Item | Detail |
|---|---|
| Purpose | Static marketing and catalog site for Hivework (`hivework.online`) |
| Stack | Vite 6.4.6, React 19, TypeScript 5 (strict), Vitest 3.2.7 with jsdom and Testing Library, `lucide-react` |
| Runtime dependencies | 3 (`react`, `react-dom`, `lucide-react`) |
| Dev dependencies | 10 |
| Size | 41 tracked files at `c66126b`; 47 at `5551c2a` |
| Hosting | Namecheap cPanel via `rsync`; Apache `.htaccess` single-page fallback |
| Backend, API calls, database, auth | None. One same-origin `fetch('./updater.json')` |
| Agent or MCP config | None in this repo |

Structure:

```
index.html                     Meta tags with hardcoded counts
vite.config.ts                 base './', Vitest config
package.json                   Scripts: sync, dev, build, deploy, test
scripts/sync-catalog.mjs       Builds catalog JSON from the main repo; copies logos and the DMG
scripts/verify-dist.mjs        Rejects root-anchored asset URLs in the build
src/App.tsx, main.tsx          Shell and path-based section routing
src/components/                HeaderNav, HeroSection, ModelMatrix, WorkforceSection,
                               SkillsSection, EmployeesSection, StorySection, ContactFooter
src/lib/cliBuilder.ts          Builds the install commands shown on the site
src/lib/clipboard.ts           Copy with legacy fallback
src/lib/navigation.ts          Section routes
src/data/catalog.generated.json  345 agents, 18 divisions, 17 tools, 25 skills, 10 reviewers, 4 runbooks, 8 employees
src/data/site.ts               URLs and emails
src/__tests__/                 4 test files
public/                        .htaccess, logos, updater.json, Hivework.dmg (twice)
docs/                          Deploy guide, plan, spec, one unrelated document
```

External repos this site depends on: `allanindrajith/hivework` (installer and content; public) and `allanindrajith/hivework-app` (desktop app; returns 404 to anonymous requests).

## 3. CLI Command Inventory

Full table with sources and line numbers: `CLI_COMMAND_INVENTORY.md`.

| Group | Commands | PASS | PARTIAL | FAIL | BLOCKED | UNTESTED | NOT IMPLEMENTED |
|---|---|---|---|---|---|---|---|
| A — this repo's own commands | 15 | 6 | 1 | 3 | 2 | 2 | 1 |
| B — commands the site gives visitors | 17 | 11 | 3 | 2 | 0 | 1 | 0 |

## 4. Working Features

All verified by execution on a simulated clean machine.

- `npm ci`, `npm test`, `npm run build`, `tsc --noEmit`, `verify-dist.mjs`.
- Catalog generation, when pointed at the main repo with `HIVEWORK_REPO_ROOT`. The committed catalog equals what the current public repo generates.
- Install commands for all 17 tools, all 18 divisions, all 345 agent slugs, all 4 runbooks.
- `--skills`, `--link`, `--dry-run`, `--no-interactive`, and their combinations.
- `./scripts/convert.sh --parallel`.
- Bootstrap one-liner on first run for home-directory tools.
- Every GitHub deep link in the catalog (agents, skills, employees, runbook docs, installer source) points at a file that exists on public `main`.
- Installer error handling for unknown tool, division, agent and option.
- Site safety basics: no `dangerouslySetInnerHTML`, `eval` or `innerHTML`; all 17 external links carry `rel="noopener"`; no debug logging in source.

## 5. Broken Features

Details and reproduction steps: `BUG_REPORT.md`.

| ID | Severity | Broken feature |
|---|---|---|
| HW-001 | HIGH | Hive-hire install command (`--skill`) |
| HW-002 | MEDIUM | Reviewer install commands (10 of 10) |
| HW-003 | MEDIUM | Claimed hive-hire support for Cursor and OpenCode |
| HW-004 | MEDIUM | Bootstrap one-liner for project-scoped tools |
| HW-005 | MEDIUM | Desktop updater download URL (404) |
| HW-006 | MEDIUM | Unsigned DMG |
| HW-007 | MEDIUM | Deploy guide commands |
| HW-008 | MEDIUM | `npm run sync` on a clean clone; missing README |
| HW-011 | LOW | Re-running the bootstrap one-liner |

## 6. CLI Testing Results

| CLI Command | Expected Result | Actual Result | Status | Error |
|---|---|---|---|---|
| `npm ci` | Dependencies installed | 163 packages, exit 0 | PASS | — |
| `npm test` | Tests pass | 32/32 | PASS | — |
| `npm run build` | Bundle in `dist/` | exit 0, 472 kB JS | PASS | — |
| `npm run dev` | Dev server | Could not bind a port in the sandbox | BLOCKED | `listen EPERM ::1:5199` |
| `npm run sync` | Catalog regenerated | exit 1 on a clean clone | PARTIAL | `tools.json not found at …/Hivework/tools.json` |
| `HIVEWORK_REPO_ROOT=… npm run sync` | Catalog regenerated | exit 0, up to date | PASS | — |
| `npm run deploy` | Site uploaded | Build passed; upload stubbed | BLOCKED | Production target |
| `npx vitest run --coverage` | Coverage report | exit 1 | FAIL | `Cannot find dependency '@vitest/coverage-v8'` |
| `cd app` (deploy guide) | Enter project | Folder does not exist | FAIL | `No such file or directory` |
| `python3 -m http.server 4173 -d app/dist` | Local preview | Path does not exist | FAIL | Wrong path |
| `prebuild` sync (deploy guide) | Runs before build | No such script | NOT IMPLEMENTED | — |
| `./scripts/install.sh` | Install for detected tools | exit 0; nothing installed on a clean machine | PARTIAL | `No tools selected or detected` |
| `./scripts/install.sh --skills` | Skills installed | exit 0; 5 tools install, 12 skip | PASS | — |
| `./scripts/convert.sh --parallel` | Conversions built | exit 0, 15 tools | PASS | — |
| `git clone … && cd hivework && …` | Clone then install | First run exit 0; second run exit 128 | PARTIAL | `destination path 'hivework' already exists` |
| `./scripts/install.sh --tool <17 ids>` | Tool installed | 17/17 exit 0 | PASS | — |
| Bootstrap + `--tool cursor` | Rules in user's project | Rules in `hivework/.cursor/rules` | PARTIAL | Installer warns `project-scoped` |
| `./scripts/install.sh --division <18>` | Division installed | 18/18 exit 0 | PASS | — |
| `./scripts/install.sh --agent <345 slugs>` | Agents installed | 345/345 resolve (296/345 before the 01:15 push) | PASS | — |
| Runbook commands (4) | Core team installed | 4/4 exit 0 | PASS | — |
| `./scripts/install.sh --agent <reviewer>` (10) | Reviewer installed | 10/10 exit 1 | FAIL | `Unknown agent 'hive-style'` |
| `./scripts/install.sh --skill hive-hire` | hive-hire installed | exit 1 | FAIL | `Unknown option: --skill` |
| `/hive-hire <slug>` | Employee deployed | Not run | UNTESTED | Needs a live agent session |
| `… --link`, `--dry-run`, `--no-interactive` | As named | exit 0 | PASS | — |

## 7. AI Agent Compatibility

Full detail: `AGENT_COMPATIBILITY.md`.

| Agent | File-level install | Runtime loading | Notes |
|---|---|---|---|
| Claude Code | PASS | UNTESTED | 345 agents, 25 skills; reviewers not installable; sandboxed sessions hit a temp-file failure in `convert.sh` |
| OpenAI Codex | PASS | UNTESTED | 345 TOML files, 25 skills; TOML validity not checked |
| Cursor | PARTIAL | UNTESTED | 345 rules; no skills; must run from the project root |
| OpenCode | PARTIAL | UNTESTED | 345 agents; no skills; installer reports an upstream limit of about 119 registered agents |
| 13 other tools | PASS or PARTIAL | UNTESTED | All exit 0 |
| MCP | n/a | n/a | Nothing in this repo |

No agent application was launched. Compatibility beyond "the right files are written to the right place" is not claimed.

## 8. Installation Experience

**Contributor to this repo.** `git clone`, `npm ci`, `npm test`, `npm run build` succeed in under a minute. The contributor has to guess those steps: there is no README, and the only guide starts with `cd app`, which fails. `npm run sync` fails until the main repo is cloned next to this one under the exact name `Hivework`, which is written down nowhere.

**Visitor to the site.** A visitor with Claude Code or Codex who copies a tool, division, agent or runbook command gets a working install. A visitor on a brand-new machine who copies the first Hero command gets "Nothing to install" and exit 0, with a hint to use `--tool`. A visitor who wants an AI Employee is stopped at the first command.

## 9. Error Log

Raw output; fuller logs in `evidence/`.

```
$ ./scripts/install.sh --skill hive-hire                       # exit 1
[ERR] Unknown option: --skill
install.sh -- Install Hivework agents into your local agentic tool(s).
```
```
$ ./scripts/install.sh --agent hive-style --dry-run            # exit 1 (same for all 10 reviewers)
[ERR] Unknown agent 'hive-style'. Use --list agents to see the available roster.
```
```
$ git clone … hivework && cd hivework && ./scripts/install.sh … # second run, exit 128
fatal: destination path 'hivework' already exists and is not an empty directory.
```
```
$ git clone … && cd hivework && ./scripts/install.sh --tool cursor --agent hive-frontend-developer   # exit 0
[OK]  Cursor: 1 rules -> <SB>/boot2/hivework/.cursor/rules
[!!]  Cursor: project-scoped. Run from your project root to install there.
```
```
$ npm run sync                                                 # exit 1
[sync-catalog] ✗ tools.json not found at <SB>/Hivework/tools.json
```
```
$ npx vitest run --coverage                                    # exit 1
 MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'
```
```
$ codesign -dv public/Hivework.dmg                             # exit 1
public/Hivework.dmg: code object is not signed at all
```
```
$ curl -sIL …/hivework-app/releases/download/v0.4.0/Hivework.app.tar.gz
HTTP 404
```
```
$ ./scripts/install.sh --agent hive-game-studio-ai-programmer  # exit 1 at public head 081e103 only
[ERR] Unknown agent 'hive-game-studio-ai-programmer'. Use --list agents to see the available roster.
```
Environment-only errors (not product defects): `listen EPERM: operation not permitted ::1:5199`; `mktemp: mkstemp failed on /var/folders/…: Operation not permitted`.

No stack traces were produced by the application code.

## 10. Security Audit

| Area | Result |
|---|---|
| Secrets in tracked files | None found (pattern scan for keys, tokens, passwords, private keys) |
| `.env` handling | `.env` and `.env.*` are git-ignored; the code reads no env files |
| Destructive commands | `npm run deploy` uses `rsync --delete` against the live site folder. It is the only destructive command and it is the intended deploy. No guard against deploying uncommitted or unpushed state |
| Dependency advisories | 3 in the dev test toolchain (2 rated critical by npm). Not in the shipped bundle (HW-010) |
| Distributed binary | Unsigned DMG served from the site (HW-006). `npm run sync` silently republishes whatever DMG sits in a sibling build folder (HW-019) |
| Updater | Signature fields are public by design. The download URL returns 404 (HW-005) |
| Command injection | Commands are assembled without quoting or slug validation (HW-015). Input is build-time data today |
| Cross-site scripting | No raw HTML injection points; React escaping throughout |
| External links | All use `rel="noopener noreferrer"` |
| Personal data | Two contact emails are published intentionally. No tracking, cookies or forms |
| Permissions | Site commands write only to the user's home or current directory. `--link` leaves symlinks pointing into the clone; deleting the clone breaks the install |
| `curl | bash` patterns | None. The site uses `git clone` followed by a local script |

## 11. Missing or Incomplete Features

| Documented or implied | State |
|---|---|
| Single-skill install (`--skill <name>`) | NOT IMPLEMENTED in the installer |
| Reviewer install from the site | NOT IMPLEMENTED in the installer |
| hive-hire for Cursor and OpenCode | NOT IMPLEMENTED (skills unsupported for those tools) |
| `prebuild` catalog sync | NOT IMPLEMENTED |
| README, LICENSE, Node version requirement | Missing |
| Coverage, lint, CI | Missing |
| X / Twitter link | `xUrl` is empty; the footer hides it |
| `--no-interactive` in the UI | Supported by the builder, never offered |
| Desktop builds for Windows or Linux | Only macOS entries in `updater.json` |
| Published desktop release | URL returns 404 |

## 12. Recommended Fixes

Ordered by severity, then by effort.

| # | Fix | Finding | Effort |
|---|---|---|---|
| 1 | Replace the four `--skill hive-hire` strings with `./scripts/install.sh --skills`, built through `buildInstallCommand` | HW-001 | 10 minutes |
| 2 | Correct the hive-hire tool list to Claude Code, Codex, Antigravity, Osaurus, DSH | HW-003 | 2 minutes |
| 3 | Remove the copy button from reviewer cards, or add `agents/` to the installer roster | HW-002 | 10 minutes / 1-2 hours |
| 4 | For project-scoped tools, emit a bootstrap command without `cd` | HW-004 | 30 minutes |
| 5 | Publish the v0.4.0 release asset or change the updater URL | HW-005 | 15 minutes |
| 6 | Sign and notarize the DMG | HW-006 | 1-2 hours first time |
| 7 | Add a README; rewrite the deploy guide without `app/` | HW-007, HW-008 | 45 minutes |
| 8 | Add the contract tests (A1, A3-A7) and a pre-deploy check that the catalog's source commit is public | HW-009 | 1 hour |
| 9 | Upgrade vitest; add `@vitest/coverage-v8` | HW-010, HW-018 | 30 minutes |
| 10 | Make the bootstrap one-liner re-runnable | HW-011 | 10 minutes |
| 11 | Switch to `base: '/'` or redirect trailing slashes | HW-012 | 20 minutes |
| 12 | Keep one DMG copy; move it out of git | HW-013 | 15 minutes |
| 13 | Validate slugs and derive the clone folder name in `cliBuilder` | HW-014, HW-015 | 20 minutes |
| 14 | Read counts from the catalog; update `updater.json` notes | HW-016 | 20 minutes |
| 15 | Delete `docs/site_documentation.md`; mark plan and spec as historical | HW-017 | 5 minutes |
| 16 | Log skipped employees; gate DMG copying behind a flag | HW-019 | 20 minutes |

## 13. Final Assessment

| Dimension | Rating | Basis |
|---|---|---|
| Build and type safety | Good | Clean strict build, zero type errors |
| Own tests | Good but inward-looking | 32/32 pass; none check the installer contract |
| Visitor command accuracy | Mostly good | 15 of 17 command families work; 2 fail outright |
| Documentation | Poor | No README; deploy guide fails at line 12; one unrelated document |
| Release hygiene | Weak | Site was published ahead of its repo; unsigned binary in git; updater points at a 404 |
| Security | Acceptable | No secrets, no injection points; dev-only advisories; unsigned DMG |
| Agent compatibility | Proven at file level only | 17/17 tools install; nothing verified inside a running agent |

**Overall: PARTIAL.** The site is sound and most of what it promises works. It should not be promoted further until HW-001 is fixed, because the feature in the page title cannot be installed by following the page. Fixes 1-3 take under 30 minutes and remove every outright command failure.

### Limits of this audit

- macOS only; one Node version.
- No browser session, no live site, no real deploy.
- No agent application launched.
- The installer lives in another repository. It was exercised as a black box and its code was not reviewed beyond its usage text and argument parser.
- Both repositories changed during the audit. Results are stated per commit; anything after `5551c2a` (web) and `c232a83` (installer) is not covered.
