# CLI Command Inventory — Hivework-web

Scope: every command found in `package.json`, `scripts/`, `docs/`, `src/` (including strings the site shows or copies to the clipboard), and config files. 41 tracked files were read at `c66126b`; the 16 files changed up to `5551c2a` were re-read.

Statuses: PASS, FAIL, PARTIAL, UNTESTED, NOT IMPLEMENTED, BLOCKED.
"Clean machine" means: fresh clone, empty `HOME`, `PATH=/usr/bin:/bin:/usr/sbin:/sbin`, macOS arm64, bash 3.2.57, Node 24.21.0, npm 11.19.0.

There are two groups. Group A is what a contributor to this repo runs. Group B is what the website tells visitors to run; those commands execute in the separate `hivework` repo.

## Group A — commands of this repository

| # | Command | Source | Purpose | Needs | Exists | Clean machine | Status |
|---|---|---|---|---|---|---|---|
| A1 | `npm install` / `npm ci` | `docs/deploy-hivework-online.md:13` | Install dependencies | Node, npm, network | yes | exit 0, 163 packages | PASS |
| A2 | `npm run dev` (`vite`) | `package.json:8` | Dev server | deps, free local port | yes | `listen EPERM` — sandbox forbids binding ports | BLOCKED |
| A3 | `npm run build` (`tsc --noEmit && vite build && node scripts/verify-dist.mjs`) | `package.json:9` | Type-check, bundle, verify paths | deps | yes | exit 0 | PASS |
| A4 | `npm test` (`vitest run`) | `package.json:11` | Unit and component tests | deps | yes | 31/31 at `c66126b`, 32/32 at `5551c2a` | PASS |
| A5 | `npm run sync` (`node scripts/sync-catalog.mjs`) | `package.json:7` | Regenerate catalog from main repo | `../Hivework` checkout or `HIVEWORK_REPO_ROOT` | yes | exit 1 without sibling; exit 0 with env var | PARTIAL (HW-008) |
| A6 | `npm run deploy` (build + `rsync -avz --delete … dist/ cpanel:~/hivework.online/`) | `package.json:10` | Publish to hosting | rsync, SSH host alias `cpanel`, credentials | yes | Build ran; rsync replaced by a stub that printed its arguments. Real upload not run (production). | BLOCKED |
| A7 | `node scripts/verify-dist.mjs` | `package.json:9` | Reject root-anchored asset URLs | built `dist/` | yes | exit 0, also from another working directory | PASS |
| A8 | `tsc --noEmit` | `package.json:9` | Type-check | deps | yes | exit 0 as part of A3 | PASS |
| A9 | `vite build` | `package.json:9` | Bundle | deps | yes | exit 0 as part of A3 | PASS |
| A10 | `npx vitest run --coverage` | not documented; implied by `.gitignore` `coverage/` | Coverage | `@vitest/coverage-v8` | no provider installed | exit 1, missing dependency | FAIL (HW-018) |
| A11 | `cd app` | `docs/deploy-hivework-online.md:12` | Enter project | — | no `app/` folder | `No such file or directory` | FAIL (HW-007) |
| A12 | `python3 -m http.server 4173 -d app/dist` | `docs/deploy-hivework-online.md:29` | Preview build | python3, port | path wrong | Path does not exist; with `-d dist` port binding is blocked | FAIL (HW-007) |
| A13 | `prebuild` → `node scripts/sync-catalog.mjs` | `docs/deploy-hivework-online.md:19` | Auto-sync before build | — | no such npm script | Build does not sync | NOT IMPLEMENTED (HW-007) |
| A14 | `git add app/… && git commit -m …` (10 lines) | `docs/plans/2026-11-12-hivework-landing-page.md:136-463` | Historical plan steps | — | paths gone | Not executed: mutates git history and paths do not exist | UNTESTED (stale, HW-017) |
| A15 | `npm ci` reference | `docs/site_documentation.md:133` | Belongs to a different project | — | n/a | Not applicable | UNTESTED (HW-017) |

Environment variables used by Group A: `HIVEWORK_REPO_ROOT` (optional, `scripts/sync-catalog.mjs:9`). No `.env` file is read. No authentication commands exist.

## Group B — commands the website gives to visitors

Local mode runs inside a clone of `github.com/allanindrajith/hivework`. Bootstrap mode prefixes `git clone https://github.com/allanindrajith/hivework.git && cd hivework && `.

| # | Command | Source | Purpose | Variants run | Result | Status |
|---|---|---|---|---|---|---|
| B1 | `./scripts/install.sh` | `HeroSection.tsx:29` | Install all for detected tools | 1 | exit 0. On a clean machine: "No tools selected or detected. Nothing to install." | PARTIAL (OBS-A) |
| B2 | `./scripts/install.sh --skills` | `HeroSection.tsx:37`, `SkillsSection.tsx:73,238`, `cliBuilder.ts:31` | Also install modular skills | 1 bare + 17 with `--tool` | exit 0. Skills installed for 5 tools, skipped with a warning for 12 | PASS |
| B3 | `./scripts/convert.sh --parallel` | `HeroSection.tsx:45` | Generate per-tool files | 2 | exit 0, 15 tools, repo left clean. Needed a `mktemp` shim inside the audit sandbox | PASS (OBS-C) |
| B4 | `git clone …/hivework.git && cd hivework && <cmd>` | `HeroSection.tsx:31,39,47`, `cliBuilder.ts:47` | One-line bootstrap | real GitHub clone ×2, local re-clone ×3 | First run exit 0. Second run exit 128 | PARTIAL (HW-011) |
| B5 | `./scripts/install.sh --tool <kebab>` | `ModelMatrix.tsx:75`, `cliBuilder.ts:14` | Install for one tool | 17 of 17 tools, real installs, twice (two repo heads) | 17/17 exit 0 | PASS |
| B6 | `… --tool cursor` via bootstrap | `ModelMatrix.tsx` + `cliBuilder.ts:47` | Project-scoped tool via one-liner | 1 real | exit 0 but files land in `hivework/.cursor/rules` | PARTIAL (HW-004) |
| B7 | `./scripts/install.sh --division <slug>` | `WorkforceSection.tsx:326`, `ModelMatrix.tsx:78` | Install one division | 18 of 18, dry-run, twice | 18/18 exit 0; agent counts equal the site's at `c232a83` | PASS |
| B8 | `./scripts/install.sh --agent <slug,…>` (agent cart) | `WorkforceSection.tsx:122`, `cliBuilder.ts:28` | Install chosen agents | 345 slugs one by one (dry-run), then all 345 in one command | `081e103`: 296 pass, 49 fail. `c232a83`: 345/345 pass | PASS now (HW-009) |
| B9 | Runbook commands (`--agent` with core roster) | `WorkforceSection.tsx:480`, `cliBuilder.ts:57` | Install a runbook's core team | 4 of 4, real installs | exit 0; 9, 15, 5, 6 agents | PASS |
| B10 | `./scripts/install.sh --agent <reviewer>` | `SkillsSection.tsx:294` | Install a reviewer | 10 of 10, twice | 10/10 exit 1 `Unknown agent` | FAIL (HW-002) |
| B11 | `./scripts/install.sh --skill hive-hire` | `EmployeesSection.tsx:57,74,111,124` | Install the hiring skill | 2 (both heads) | exit 1 `Unknown option: --skill` | FAIL (HW-001) |
| B12 | `/hive-hire <slug>` | `EmployeesSection.tsx:113` | Hire an employee inside an agent session | 0 | Skill file is installed by B2 for 5 tools. Invocation needs a live, logged-in agent | UNTESTED |
| B13 | `… --link` | `ModelMatrix.tsx:314`, `cliBuilder.ts:34` | Symlink instead of copy | 1 dry-run, 1 real | exit 0; 129 symlinks pointing into the clone | PASS |
| B14 | `… --dry-run` | `ModelMatrix.tsx:331`, `cliBuilder.ts:37` | Print plan only | 400+ | exit 0; nothing written | PASS |
| B15 | `… --no-interactive` | `cliBuilder.ts:40` (never shown by the UI) | Skip wizard | 1 | exit 0 | PASS |
| B16 | `./scripts/convert.sh` (mentioned in prose) | `StorySection.tsx:55` | Convert | covered by B3 and by auto-convert during B5 | exit 0 | PASS |
| B17 | "install.sh source" link | `HeroSection.tsx:262` | Open script on GitHub | file present on `main` | exists | PASS |

### Negative and edge cases run for Group B

| Case | Command | Result |
|---|---|---|
| Unknown tool | `./scripts/install.sh --tool bogus` | exit 1, lists valid tools |
| Unknown division | `./scripts/install.sh --division bogus` | exit 1, lists valid divisions |
| Unknown agent | `./scripts/install.sh --agent hive-does-not-exist` | exit 1, points to `--list agents` |
| One good, one bad agent | `--agent hive-frontend-developer,<missing>` | exit 1, nothing installed |
| Missing flag value | `./scripts/install.sh --tool` | raw bash message, exit 0 (OBS-B) |
| Wrong directory | `./scripts/install.sh --skills` outside the clone | exit 127, `No such file or directory` |
| Run by absolute path from a project folder | `<clone>/scripts/install.sh --tool cursor` | exit 0, installs into that project |
| `sh` instead of bash | `sh scripts/install.sh --help` | syntax error (OBS-D) |
| Unwritable home | `HOME=/nonexistent-ro … --tool claude-code` | exit 1, clear error |
| git missing from `PATH` | `git clone …` | exit 127, `git: command not found` |
| Temp dir blocked | `./scripts/convert.sh --parallel` without shim | exit 1, `mktemp: mkstemp failed` (OBS-C) |

### Flags the site can emit vs flags the installer accepts

Emitted: `--tool`, `--division`, `--agent`, `--skills`, `--link`, `--dry-run`, `--no-interactive`, `--skill`.
Accepted (from the installer's usage block): `--tool`, `--division`, `--agent`, `--agents-file`, `--skills`, `--link`, `--path`, `--interactive`, `--no-interactive`, `--no-convert`, `--dry-run`, `--list`, `--parallel`, `--jobs`, `--help`.
Only mismatch: `--skill`.

All 17 tool identifiers in the site catalog (`claude-code, codex, gemini-cli, copilot, qwen, cursor, opencode, osaurus, aider, antigravity, kimi, openclaw, windsurf, hermes, vibe, zcode, dsh`) are accepted by the installer.
