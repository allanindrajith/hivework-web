# Bug Report — Hivework-web

Audit date: 2026-11-13. Web repo audited at `c66126b`, re-verified at `5551c2a`.
User-facing commands were run against the public `github.com/allanindrajith/hivework` repo at two heads: `081e103` (cloned 01:12) and `c232a83` (cloned after the 01:15 push).

Every entry is labelled **Confirmed** (executed, output captured), **Derived** (follows from verified facts, not executed end to end), or **Unverified**.
Evidence logs are in `audit-reports/evidence/`. `<SB>` is the audit sandbox root.

## Fix status (2026-11-13, after the audit)

| ID | Fix state | What changed |
|---|---|---|
| HW-001 | Fixed | Hire buttons and banner use `./scripts/install.sh --skills`, built by `buildInstallCommand` |
| HW-002 | Fixed | Reviewer cards no longer offer a CLI copy button; GitHub link kept |
| HW-003 | Fixed | Banner lists Claude Code, Codex, Antigravity, Osaurus, DSH |
| HW-004 | Fixed | Bootstrap clones to `~/hivework` and runs the script by path, so the current folder is kept. Executed: Cursor rule landed in the project folder |
| HW-005 | Fixed (local; live after deploy) | The 02:28 `Hivework.app.tar.gz` was re-signed with `~/.tauri/hivework.key` (its public key matches the app's configured `pubkey`), then `npm run sync:desktop` copied it to `public/downloads/` and rewrote `updater.json` to point at `https://hivework.online/downloads/Hivework.app.tar.gz` for `darwin-aarch64` only. The signature was verified in Node (Ed25519 over BLAKE2b-512, plus the trusted comment) against the hosted file. It takes effect once the site is deployed |
| HW-006 | Open — no signing identity | `security find-identity -v -p codesigning` → 0 identities. Needs an Apple Developer ID certificate. Site now tells users how to open an unnotarized app |
| HW-022 | Fixed (new) | Site claimed "Universal DMG" / "Apple Silicon & Intel"; the binary is arm64 only and the "universal" DMG is byte-identical to the aarch64 one. Copy now says Apple Silicon; `sync:desktop` reads the Mach-O header and lists only matching `updater.json` platforms, so Intel Macs are never offered an arm64 build. A later commit (4a9f18f) re-added `darwin-x86_64` to the committed `public/updater.json` by hand; removed again after `lipo -archs` on the 02:28 build confirmed `arm64` only |
| HW-023 | Fixed (new) | `sync:desktop` looked for `dmg/Hivework.dmg`; Tauri writes `Hivework_<version>_<arch>.dmg`, so it silently copied nothing. Now picks the newest `Hivework*.dmg` |
| HW-007 | Fixed | Deploy guide rewritten for the repo-root layout |
| HW-008 | Fixed | `README.md` added: requirements, scripts, `HIVEWORK_REPO_ROOT` |
| HW-009 | Guarded | `installerContract.test.ts`; runs in `npm run deploy` (with `HIVEWORK_REPO_ROOT`) and in CI. Fails against old head `081e103`, passes on `c232a83` |
| HW-010 | Fixed | Vitest 5.1.0; `npm audit`: 0 vulnerabilities |
| HW-011 | Fixed | Bootstrap pulls if `~/hivework` exists, clones otherwise. Executed twice, both exit 0 |
| HW-012 | Fixed (not live-tested) | `.htaccess` 301-redirects `/path/` to `/path` |
| HW-013 | Fixed | Root `public/Hivework.dmg` removed; sync writes only `public/downloads/` |
| HW-014 | Fixed | Clone folder follows the repo URL |
| HW-015 | Fixed | Non-kebab-case slugs are dropped from commands |
| HW-016 | Fixed | Components read counts from data. `index.html` uses `%HW_*%` tokens filled by a Vite plugin; `verify-dist` fails on leftovers. Desktop card no longer claims "345 agent personas". `updater.json` notes ("296") are correct: the app's own source ships 296 agents |
| HW-017 | Fixed | `docs/site_documentation.md` removed; plan and spec marked historical |
| HW-018 | Fixed | `@vitest/coverage-v8`, `npm run test:coverage` (78% statements), `.github/workflows/ci.yml` |
| HW-019 | Fixed | Skipped employees are logged; DMG copy is opt-in (`npm run sync:desktop`) and prints SHA-256 |
| HW-020 | Fixed | Skill-card button reads `--skills (all)` |
| HW-021 | Not a bug | `buymeacoffee.com/allanidrajith` → 200; `allanindrajith` → 404. Current link is correct |
| OBS-B | Fixed (installer repo) | `install.sh`/`convert.sh` flags without a value now exit 1 with `--x requires a value`; root cause was the EXIT trap replacing the `${2:?}` status |
| OBS-C | Fixed (installer repo) | All bare `mktemp` calls (3 in scripts, 7 in tests) use `${TMPDIR:-/tmp}/hive-*.XXXXXX`. Installer test suite in a sandbox: 12/21 → 19/21 pass; the other 2 need Python 3.11+ and PyYAML |
| OBS-A, OBS-D | Unchanged by design | Bare install on a machine with no tools now gets a Hero hint ("Add --tool <name>"); bash is required and stated in the installer header |

| ID | Severity | Status | One-line summary |
|---|---|---|---|
| HW-001 | HIGH | Confirmed | `./scripts/install.sh --skill hive-hire` is rejected by the installer |
| HW-002 | MEDIUM | Confirmed | All 10 reviewer "copy command" buttons emit a command that fails |
| HW-003 | MEDIUM | Confirmed | Site says hive-hire installs into Cursor and OpenCode; the installer skips skills for both |
| HW-004 | MEDIUM | Confirmed | Bootstrap one-liner for project-scoped tools installs into the cloned repo, not the user's project |
| HW-005 | MEDIUM | Confirmed | `public/updater.json` points at a release asset that returns HTTP 404 |
| HW-006 | MEDIUM | Confirmed | The downloadable `Hivework.dmg` is not code-signed |
| HW-007 | MEDIUM | Confirmed | Deploy guide commands fail: `cd app`, `app/dist`, and a `prebuild` step that does not exist |
| HW-008 | MEDIUM | Confirmed | `npm run sync` fails on a clean clone; the sibling-repo requirement is undocumented; no README |
| HW-009 | MEDIUM | Confirmed, then resolved | Site catalog was ahead of the public repo: 49 agent commands failed, 61 links pointed at missing files |
| HW-010 | MEDIUM | Confirmed | `npm audit` reports 3 advisories (2 rated critical by npm) in the dev test toolchain |
| HW-011 | LOW | Confirmed | Bootstrap one-liner fails on second run (`destination path 'hivework' already exists`) |
| HW-012 | LOW | Derived | Trailing-slash or nested URLs resolve assets to a wrong path and load a blank page |
| HW-013 | LOW | Confirmed | The 9.3 MB DMG is committed twice and shipped twice |
| HW-014 | LOW | Confirmed | `cd hivework` is hardcoded even when a different repo URL is passed |
| HW-015 | LOW | Potential risk | Command builder emits values unquoted |
| HW-016 | LOW | Confirmed | Hardcoded counts in copy; `updater.json` notes say 296 agents while the site says 345 |
| HW-017 | LOW | Confirmed | `docs/site_documentation.md` documents a different project |
| HW-018 | LOW | Confirmed | No coverage provider, lint script, or CI; `vitest --coverage` fails |
| HW-019 | LOW | Confirmed (code read) | `sync-catalog.mjs` swallows errors and silently copies binaries from a sibling repo |
| HW-020 | LOW | Confirmed | Each skill card's copy button copies the install-everything command |
| HW-021 | LOW | Unverified | Buy Me a Coffee handle is spelled `allanidrajith`, GitHub handle is `allanindrajith` |

---

## HW-001 — `--skill hive-hire` is not a real installer flag (HIGH)

- **Files:** `src/components/EmployeesSection.tsx:57`, `:74`, `:111`, `:124`
- **Trigger:** `./scripts/install.sh --skill hive-hire`
- **Reproduce:** clone the public repo, run the command from the repo root.
- **Actual:** exit code 1.
  ```
  [ERR] Unknown option: --skill
  install.sh -- Install Hivework agents into your local agentic tool(s).
  ```
- **Expected:** the hive-hire skill is installed, as the Employees section promises.
- **Root cause:** the installer only accepts `--skills` (plural, no argument, installs every skill). The site hardcodes a singular flag with a value in four places, bypassing `cliBuilder.ts`. Both the banner button and every per-employee hire button copy the same broken string.
- **Fix:** replace the four strings with `./scripts/install.sh --skills` (verified to install `hive-hire` for claude-code, codex, antigravity, osaurus, dsh), and build it through `buildInstallCommand({ skills: true })` so the existing tests cover it.
- **Reproducible:** yes, at both `081e103` and `c232a83`. Evidence: `C04-skill-hive-hire.log`, `D01-skill-hive-hire.log`.
- **Impact:** the entire "8 AI Employees" feature has no working install path from the site.

## HW-002 — Reviewer copy commands fail for all 10 reviewers (MEDIUM)

- **File:** `src/components/SkillsSection.tsx:294-298`
- **Trigger:** `./scripts/install.sh --agent hive-style` (same for the other 9 reviewer slugs)
- **Actual:** exit 1, `[ERR] Unknown agent 'hive-style'. Use --list agents to see the available roster.`
- **Expected:** the reviewer agent is installed.
- **Root cause:** reviewers live in `agents/` in the source repo. The installer's `--agent` roster only covers division folders. A full `--tool claude-code --skills` install also placed 0 reviewer files in `~/.claude/agents`.
- **Fix:** either remove the copy button from reviewer cards and keep the GitHub link, or add `agents/` to the installer's roster.
- **Reproducible:** yes, 10 of 10 at both heads. Evidence: `C31-reviewer-hive-style.log`, `D04-reviewer-hive-style.log`.

## HW-003 — hive-hire harness list is wrong (MEDIUM)

- **File:** `src/components/EmployeesSection.tsx:112`
- **Claim:** "install the universal hiring manager into Claude Code, Cursor, Codex, OpenCode, or Antigravity".
- **Actual:** `--tool cursor --skills` and `--tool opencode --skills` both print `modular skills (--skills) not supported; skipping.` No `hive-hire` directory is created.
- **Verified skill-capable tools:** claude-code, codex, antigravity, osaurus, dsh (the Skills section banner lists these correctly).
- **Fix:** change the sentence to the five tools above.
- **Evidence:** `D10-tool-cursor.log`, `D10-tool-opencode.log`.

## HW-004 — Bootstrap one-liner installs project-scoped tools into the clone (MEDIUM)

- **Files:** `src/lib/cliBuilder.ts:45-48`, `src/components/ModelMatrix.tsx:75-83`
- **Trigger:** `git clone https://github.com/allanindrajith/hivework.git && cd hivework && ./scripts/install.sh --tool cursor`
- **Actual:** exit 0; rules land in `hivework/.cursor/rules/`. The installer itself warns `Cursor: project-scoped. Run from your project root to install there.`
- **Expected:** rules land in the user's own project.
- **Root cause:** the one-liner `cd`s into the clone before running. Cursor, OpenCode, Qwen, Aider and Windsurf install relative to the current directory.
- **Fix:** for tools whose catalog `scope.project` is true and `scope.user` is false, emit `git clone … && ./hivework/scripts/install.sh --tool cursor` (no `cd`). Running the script by path from another directory was verified to work.
- **Evidence:** `D20-bootstrap-cursor.log` (cursor executed). The other four are confirmed project-scoped by where their files landed in the per-tool runs.

## HW-005 — Updater endpoint points at a 404 (MEDIUM)

- **File:** `public/updater.json:8,12` (committed in `4a9f18f`)
- **Trigger:** `curl -sIL https://github.com/allanindrajith/hivework-app/releases/download/v0.4.0/Hivework.app.tar.gz`
- **Actual:** HTTP 404 (checked twice, about 20 minutes apart). The `hivework-app` repo page also returns 404 to anonymous requests.
- **Expected:** a downloadable, signed update bundle.
- **Root cause:** the release asset does not exist publicly (repo private or release not published).
- **Fix:** publish the release, or point the URL at a file hosted on `hivework.online`.
- **Not tested:** whether the Tauri client handles the 404 gracefully.

## HW-006 — DMG is not code-signed (MEDIUM)

- **Files:** `public/downloads/Hivework.dmg`, linked from `HeaderNav.tsx:85`, `HeroSection.tsx:147`, `ModelMatrix.tsx:177`
- **Trigger:** `codesign -dv public/Hivework.dmg`
- **Actual:** `public/Hivework.dmg: code object is not signed at all`
- **Expected:** a signed and notarized disk image, so macOS opens it without a Gatekeeper block.
- **Not tested:** notarization (`spctl` errored inside the sandbox), and whether the `.app` inside the image is signed.
- **Fix:** sign and notarize in the app's release pipeline; verify with `spctl -a -t open --context context:primary-signature -v`.

## HW-007 — Deploy guide is stale (MEDIUM)

- **File:** `docs/deploy-hivework-online.md:12`, `:19`, `:29` (14 `app/` references in total)
- **Triggers and results:**
  - `cd app` → `No such file or directory` (there is no `app/` folder; the project is at the repo root).
  - `python3 -m http.server 4173 -d app/dist` → wrong path, should be `dist`.
  - The guide says `npm run build` runs a `prebuild` catalog sync. `package.json` has no `prebuild` script; build runs `tsc`, `vite build`, `verify-dist` only.
- **Root cause:** the guide was written when the site lived in `app/` inside the main repo.
- **Fix:** drop the `app/` prefix everywhere, describe `npm run sync` as a separate manual step, document `npm run deploy` and the `cpanel` SSH alias it needs.

## HW-008 — `npm run sync` fails on a clean clone; no README (MEDIUM)

- **Files:** `scripts/sync-catalog.mjs:8-9`, `package.json:7`
- **Trigger:** `npm run sync` in a fresh clone.
- **Actual:** exit 1, `[sync-catalog] ✗ tools.json not found at <SB>/Hivework/tools.json`
- **Root cause:** the script needs the main repo checked out at `../Hivework`, or `HIVEWORK_REPO_ROOT` set. Neither is documented. The repo has no README, no LICENSE, no `engines` field, no `.nvmrc`.
- **Derived (not executed):** on a case-sensitive filesystem, `git clone …/hivework.git` creates `hivework`, which does not match the default `Hivework`.
- **Works when configured:** `HIVEWORK_REPO_ROOT=<clone> npm run sync` → exit 0, catalog reported up to date.
- **Fix:** add a README covering install, dev, test, build, sync (with the env var), deploy.

## HW-009 — Site catalog ahead of the public repo (MEDIUM, resolved during audit)

- **File:** `src/data/catalog.generated.json`
- **Observed at 01:12 (public head `081e103`):** site listed 345 agents, 25 skills, 8 employees. Public repo had 296, 21, 0.
  - 49 `--agent hive-game-studio-*` commands failed with `Unknown agent`.
  - A cart command mixing one valid and one missing slug failed entirely (exit 1).
  - 61 GitHub links on the site (49 agents, 4 skills, 8 employees) pointed at files that did not exist.
- **Resolved at 01:15:** commit `c232a83` was pushed. Re-test: 345 of 345 slugs resolve, totals match exactly.
- **Root cause:** the catalog is generated from a local working copy and committed; nothing checks that the source commit is public before the site ships.
- **Fix:** write the source commit SHA into the catalog and fail `npm run deploy` when `git ls-remote origin main` does not contain it.
- **Evidence:** `C45-site-only-agent.log`, `D02-all-345-agents.log`.

## HW-010 — Dev-dependency advisories (MEDIUM)

- **Trigger:** `npm audit` → exit 1, `3 vulnerabilities (1 moderate, 2 critical)`.
- **Packages:** `tinypool <=2.1.1` (2 advisories, rated critical by npm), `@vitest/mocker <=4.1.11` (moderate), both pulled in by `vitest 3.2.7`.
- **Scope:** test toolchain only. None of these packages are in the built bundle.
- **Fix:** upgrade vitest to the release `npm audit` proposes (`5.1.0`, a breaking major) and re-run the suite. Rated MEDIUM here because it is not shipped to users.

## HW-011 — Bootstrap one-liner is not re-runnable (LOW)

- **Trigger:** run any bootstrap command a second time in the same folder.
- **Actual:** exit 128, `fatal: destination path 'hivework' already exists and is not an empty directory.` The `&&` chain stops, so the install never runs.
- **Fix:** `[ -d hivework ] || git clone … ; cd hivework && git pull --ff-only && ./scripts/install.sh …`
- **Evidence:** `C51-bootstrap-second-time.log`.

## HW-012 — Trailing-slash URLs break asset loading (LOW, derived)

- **Files:** `vite.config.ts:6` (`base: './'`), `public/.htaccess`, `src/lib/navigation.ts`
- **Reasoning:** built `index.html` references `./assets/index-*.js`. From `https://hivework.online/agents/` that resolves to `/agents/assets/index-*.js`. The `.htaccess` rewrites that missing file to `index.html`, so the browser receives HTML where it expects JavaScript.
- **Verified:** the URL resolution, with Node's `URL` on the built file. `/agents` (no slash) resolves correctly.
- **Not verified:** behaviour on a live Apache server (local port binding was blocked in the sandbox).
- **Fix:** set `base: '/'` (the site is served from the domain root and already uses a root-absolute DMG link), and relax `verify-dist.mjs` accordingly.

## HW-013 — DMG committed and shipped twice (LOW)

- `public/Hivework.dmg` and `public/downloads/Hivework.dmg` are byte-identical (9,758,693 bytes each). Only `/downloads/Hivework.dmg` is linked. `dist/` grew to 21 MB and `.git` to 20 MB.
- **Root cause:** `scripts/sync-catalog.mjs` `syncDesktopApp()` copies to both paths.
- **Fix:** keep one copy, and prefer a release asset over a binary in git.

## HW-014 — `cd hivework` is hardcoded (LOW)

- **File:** `src/lib/cliBuilder.ts:47`
- `buildInstallCommand({ mode: 'bootstrap', repoUrl: 'https://github.com/someone/my-fork' })` returns `git clone …/my-fork.git && cd hivework && …`.
- Latent today because every caller uses the default URL. Fix: derive the folder from the last path segment.

## HW-015 — Values are emitted unquoted (LOW, potential risk)

- **File:** `src/lib/cliBuilder.ts:14-28`
- `buildInstallCommand({ agents: ['x; echo pwned'] })` returns `./scripts/install.sh --agent x; echo pwned`.
- Not exploitable today: slugs come from the build-time catalog, not from visitor input. A file with an unusual name in the source repo would flow straight into a command users paste into a shell.
- **Fix:** drop any slug that does not match `/^[a-z0-9-]+$/`.

## HW-016 — Hardcoded counts (LOW)

- `EmployeesSection.tsx:93` ("8 autonomous AI employees"), `HeroSection.tsx:40` ("25 modular"), `WorkforceSection.tsx:277` ("345 agents"), `index.html:7-30` (345 / 18 / 8 / 25 / 17+).
- All match the catalog today. `public/updater.json` notes still say "296 hive-* agent corpus".
- **Fix:** read counts from `catalog.totals`; add a test that compares `index.html` with the catalog.

## HW-017 — Unrelated document in `docs/` (LOW)

- `docs/site_documentation.md` is titled "EGM website and documentation", describes an Astro Starlight site under `site/`, and names a different author. Nothing in it applies to this repo.
- `docs/plans/…` and `docs/specs/…` use `app/…` paths from the old layout. Their `git add app/…` lines would fail if followed.

## HW-018 — No coverage, lint or CI (LOW)

- `npx vitest run --coverage` → exit 1, `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'`.
- No lint script, no `.github/workflows`. Coverage percentage is therefore unknown.

## HW-019 — `sync-catalog.mjs` hides failures (LOW, code read)

- Line 245: unparseable employee folders are skipped inside an empty `catch`, so an employee can silently vanish from the site.
- Lines 291-294: when called with a non-default root, output goes to `<root>/app/…`, a leftover from the old layout.
- `syncDesktopApp()` (added in `4bc9197`): `npm run sync` now copies a DMG from `../Hivework-app/src-tauri/target/…` into `public/` when that folder exists, with no flag and no checksum. Whatever local build is lying there gets published by the next deploy.

## HW-020 — Skill cards copy the install-all command (LOW)

- `SkillsSection.tsx:238-242`: each of the 25 cards copies `./scripts/install.sh --skills`. The installer has no single-skill option. Relabel the button or move it to the banner only.

## HW-021 — Possible typo in support link (LOW, unverified)

- `src/data/site.ts:8` uses `buymeacoffee.com/allanidrajith`; the GitHub handle is `allanindrajith`. Both spellings returned HTTP 301 to an automated request, so this could not be settled. Check by hand.

---

## Observations in the installer repo (outside this repo, affect the user journey)

| ID | Observation | Evidence |
|---|---|---|
| OBS-A | Bare `./scripts/install.sh` on a machine with no detected tools exits 0 and installs nothing (`No tools selected or detected`). The Hero "Install All" tab gives a newcomer no result. | `C06-bare.log` |
| OBS-B | `./scripts/install.sh --tool` (no value) prints a raw bash message and exits 0. | `C47-tool-missing-value.log` |
| OBS-C | `convert.sh` calls bare `mktemp`. On macOS that ignores `TMPDIR`; in a sandbox that blocks `/var/folders` it fails with `mktemp: mkstemp failed … Operation not permitted`. Sandboxed AI agents hit this. | `C08-convert-parallel.log` |
| OBS-D | `sh scripts/install.sh` fails with a syntax error; bash is required. | Sandbox log C49 |
| OBS-E | Install into an unwritable home exits 1 with a clear `[ERR] Failed: claude-code` summary. Good behaviour. | `C52-readonly-home.log` |
