# Sandbox Test Log — Hivework-web

Commands actually executed, with exit codes and trimmed output. Roughly 550 command executions were logged; repetitive families are summarised as counts. Key raw logs are in `audit-reports/evidence/`.

## Sandbox design

| Item | Value |
|---|---|
| Host | macOS, Darwin arm64 |
| Isolation | OS-level sandbox per command (writes limited to the audit scratch folder; network limited to hosts named below) |
| Sandbox root `<SB>` | session scratch folder, outside the repository |
| Repo under test | `git clone` of this repo into `<SB>/web` (`c66126b`) and `<SB>/web2` (`5551c2a`) |
| Visitor simulation | `env -i HOME=<SB>/homes/<fresh> PATH=/usr/bin:/bin:/usr/sbin:/sbin TERM=dumb NO_COLOR=1`, stdin closed |
| Runtimes | Node v24.21.0, npm 11.19.0, GNU bash 3.2.57, Python 3.9.6 |
| Network hosts used | `registry.npmjs.org`, `github.com`, `www.buymeacoffee.com` |
| Original repo | Not modified. `git status` stayed clean apart from the new `audit-reports/` folder |

Two deviations from a real fresh machine, both recorded so results can be read correctly:

1. **`mktemp` shim.** macOS bare `mktemp` writes to `/var/folders`, which the sandbox blocks. A 6-line wrapper redirected it to `<SB>/tmp`. Runs before the shim are kept below as-is.
2. **`rsync` stub.** `npm run deploy` targets production hosting. `rsync` was replaced by a script that prints its arguments.

Things that happened during the audit and changed results:

- 01:15 — the public `hivework` repo moved from `081e103` to `c232a83`. All failing command families were re-run against the new head (D-series).
- 01:35-01:40 — this repo gained three commits (`4a9f18f`, `4bc9197`, `5551c2a`). Install, test, build and audit tests were re-run on `5551c2a` (E-series).

## T-series — this repository at `c66126b`

| ID | Command | Exit | Output (trimmed) |
|---|---|---|---|
| T01 | `npm test` before installing deps | 127 | `sh: vitest: command not found` |
| T02 | `npm run build` before installing deps | 127 | `sh: tsc: command not found` |
| T03 | `npm ci` | 0 | `3 vulnerabilities (1 moderate, 2 critical)`; npm warned that `esbuild` and `fsevents` install scripts were not run |
| T04 | `npm audit` | 1 | `tinypool <=2.1.1` critical; `@vitest/mocker <=4.1.11` moderate; fix is `vitest@5.1.0` (breaking) |
| T05 | `npm test` | 0 | `Test Files 4 passed (4)`, `Tests 31 passed (31)`, 1.30 s |
| T06 | `npm run build` | 0 | `2104 modules transformed`; JS 469.03 kB (gzip 129.60 kB); `[verify-dist] ✓ Verified relative asset paths` |
| T07 | `npm run sync` (no sibling repo) | 1 | `[sync-catalog] ✗ tools.json not found at <SB>/Hivework/tools.json` |
| T08 | `HIVEWORK_REPO_ROOT=/nonexistent npm run sync` | 1 | `[sync-catalog] ✗ tools.json not found at /nonexistent/tools.json` |
| T09 | `node <SB>/web/scripts/verify-dist.mjs` from `/` | 0 | `[verify-dist] ✓ Verified relative asset paths` |
| T10 | `npx vitest run --coverage` | 1 | `MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'` |
| T12 | `npm run deploy` (rsync stubbed) | 0 | `[STUB rsync] args: -avz --delete --exclude=.well-known --exclude=cgi-bin dist/ cpanel:~/hivework.online/` |
| T13 | `npx vite --port 5199 --strictPort` | n/a | `Error: listen EPERM: operation not permitted ::1:5199` — environment limit, not a product bug |
| T14 | `ls app` (for the documented `cd app`) | 1 | `ls: app: No such file or directory` |
| T15 | `git clone https://github.com/allanindrajith/hivework.git` | 0 | Cloned; head `081e103`; 21 skills; no `employees/` |

Catalog comparison at 01:12 (site vs public repo, via the repo's own `buildCatalog()`):

```
site totals   {"agents":345,"divisions":18,"tools":17,"skills":25,"reviewers":10,"runbooks":4,"employees":8}
public totals {"agents":296,"divisions":18,"tools":17,"skills":21,"reviewers":10,"runbooks":4,"employees":0}
skills site-only: hive-craft-anything,hive-game-studio,hive-hire,hive-scrapling
employees site-only: (all 8)
agents site-only: 49  {"game-development":49}
```

## C-series — visitor commands against public head `081e103`

| ID | Command | Exit | Output (trimmed) |
|---|---|---|---|
| C01 | `./scripts/install.sh --help` | 0 | 56 lines of usage |
| C02 | `./scripts/install.sh --list tools` | 0 | 17 tool ids |
| C03 | `./scripts/install.sh --list teams` | 0 | 18 divisions; `game-development 22 agents` |
| C04 | `./scripts/install.sh --skill hive-hire` | 1 | `[ERR] Unknown option: --skill` |
| C05 | `./scripts/install.sh --dry-run` | 0 | 17 tools "not found"; `No tools selected or detected. Nothing to install.` |
| C06 | `./scripts/install.sh` | 0 | Same as C05 |
| C07 | `./scripts/install.sh --skills` | 0 | Same as C05 |
| C08 | `./scripts/convert.sh --parallel` (no shim) | 1 | `mktemp: mkstemp failed on /var/folders/…: Operation not permitted` |
| C08b | Same, with shim | 0 | `[OK] Done. 15 tools (parallel…)`; `git status` clean afterwards |
| C10 | `install.sh --tool <t> --skills` ×17 (no shim) | 0 ×2, 1 ×15 | 15 failed at `convert.sh failed; run it manually` — caused by the temp-dir block, superseded by C11 |
| C11 | Same ×17, with shim, fresh clone, fresh home each | 0 ×17 | See per-tool table below |
| C20 | `install.sh --division <d> --dry-run` ×18 | 0 ×18 | Counts equal the site's except `game-development` (22 vs 71) |
| C21 | Runbook commands ×4 (real install) | 0 ×4 | `Done! Installed 1 tool(s).` — 9, 15, 5, 6 agents |
| C30 | `install.sh --agent <slug> --dry-run` ×345 | 0 ×296, 1 ×49 | All 49 failures: `[ERR] Unknown agent 'hive-game-studio-…'` |
| C31 | `install.sh --agent <reviewer> --dry-run` ×10 | 1 ×10 | `[ERR] Unknown agent 'hive-style'. Use --list agents…` |
| C40 | `--tool claude-code --division engineering --skills --link --dry-run` | 0 | `Agents: 66  Mode: symlink`, `Skills: 21` |
| C41 | Same without `--dry-run` | 0 | 129 symlinks, 0 regular files |
| C42 | `--tool bogus` | 1 | `[ERR] Unknown tool 'bogus'. Valid: claude-code copilot …` |
| C43 | `--division bogus` | 1 | `[ERR] Unknown division 'bogus'. Valid: academic design …` |
| C44 | `--agent hive-does-not-exist` | 1 | `[ERR] Unknown agent 'hive-does-not-exist'.` |
| C45 | `--agent hive-game-studio-ai-programmer` | 1 | `[ERR] Unknown agent …` |
| C46 | `--agent hive-frontend-developer,hive-game-studio-ai-programmer` | 1 | Whole command rejected |
| C47 | `--tool` (no value) | 0 | `./scripts/install.sh: line 1633: 2: --tool requires a value` |
| C48 | `./scripts/install.sh --skills` from an unrelated folder | 127 | `No such file or directory` |
| C49 | `sh scripts/install.sh --help` | n/a | `line 153: syntax error near unexpected token '<'` |
| C50 | Bootstrap one-liner, first run | 0 | `Agents: 296  Mode: copy` |
| C51 | Bootstrap one-liner, second run | 128 | `fatal: destination path 'hivework' already exists and is not an empty directory.` |
| C52 | `HOME=/nonexistent-ro … --tool claude-code --agent hive-frontend-developer` | 1 | `[ERR] Failed: claude-code — see the [ERR] line under each above.` |
| C53 | `git clone …` with git removed from `PATH` | 127 | `git: command not found` |
| C54 | `ls skills/hive-hire employees` | 1 | Both missing at `081e103` |
| C55 | `./scripts/convert.sh --help` | 0 | Usage printed |
| C56 | `./scripts/update.sh --help` | 0 | `You are already on the latest version of Hivework.` |

C60-C63 (same commands inside the local working copy) are discarded: every run died with `cannot create temp file for here document: Operation not permitted`, a sandbox restriction on that folder.

## D-series — visitor commands against public head `c232a83`

Catalog comparison after the push: site and public totals identical (345 / 18 / 17 / 25 / 10 / 4 / 8), zero site-only or public-only entries.

| ID | Command | Exit | Output (trimmed) |
|---|---|---|---|
| D01 | `./scripts/install.sh --skill hive-hire` | 1 | `[ERR] Unknown option: --skill` |
| D02 | `--agent <all 345 slugs> --dry-run` | 0 | `Agents: 345  Mode: copy` |
| D03 | `--agent <game-studio slug> --dry-run`, one per slug | 0 for all | Previously failing slugs now resolve |
| D04 | `--agent <reviewer> --dry-run` ×10 | 1 ×10 | `[ERR] Unknown agent 'hive-style'.` |
| D05 | `--division <d> --dry-run` ×18 | 0 ×18 | All counts equal the site's (`game-development` 71 = 71) |
| D10 | `--tool <t> --skills` ×17, fresh home each | 0 ×17 | Table below |
| D11 | `./scripts/convert.sh --parallel` | 0 | `Done. 15 tools`; `git status` clean |
| D20 | Bootstrap + `--tool cursor --agent hive-frontend-developer` | 0 | `Cursor: 1 rules -> <SB>/boot2/hivework/.cursor/rules`, then `Cursor: project-scoped. Run from your project root to install there.` |
| D21 | `--tool claude-code --no-interactive --dry-run` | 0 | `Agents: 345  Mode: copy` |

Per-tool real installs at `c232a83` (D10). "Home" and "Project" are file counts written under the fake home and the working directory.

| Tool | Exit | Home | Project | hive-hire installed | Skills skipped |
|---|---|---|---|---|---|
| claude-code | 0 | 878 | 0 | yes | no |
| codex | 0 | 878 | 0 | yes | no |
| gemini-cli | 0 | 345 | 0 | no | yes |
| copilot | 0 | 690 | 0 | no | yes |
| qwen | 0 | 0 | 345 | no | yes |
| cursor | 0 | 0 | 345 | no | yes |
| opencode | 0 | 0 | 345 | no | yes |
| osaurus | 0 | 878 | 0 | yes | no |
| aider | 0 | 0 | 1 | no | yes |
| antigravity | 0 | 878 | 0 | yes | no |
| kimi | 0 | 690 | 0 | no | yes |
| openclaw | 0 | 1035 | 0 | no | yes |
| windsurf | 0 | 0 | 1 | no | yes |
| hermes | 0 | 4 | 0 | no | yes |
| vibe | 0 | 690 | 0 | no | yes |
| zcode | 0 | 345 | 0 | no | yes |
| dsh | 0 | 878 | 0 | yes | no |

Installer warnings worth knowing: `opencode: registers only ~119 agents (upstream bug anomalyco/opencode#27988)`; `Copilot: Verify VS Code setting 'chat.agentFilesLocations' includes your install path`; `Hermes: restart sessions/gateway so the new plugin toolset is discovered`.

Structure check of installed files (Python script, read-only):

```
claude-code agents (name,description): files=345 missing=0
claude-code skills SKILL.md (name,description): files=25 missing=0
cursor rules .mdc (description): files=345 missing=0
opencode agents (description): files=345 missing=0
gemini-cli agents (name,description): files=345 missing=0
copilot agents: files=345 missing=0
codex TOML: tomllib unavailable (python < 3.11) — UNTESTED
claude-code duplicate agent names: none
```

## E-series — this repository at `5551c2a`

| ID | Command | Exit | Output (trimmed) |
|---|---|---|---|
| E01 | `npm ci` | 0 | `added 163 packages`; `3 vulnerabilities (1 moderate, 2 critical)` |
| E02 | `npm test` | 0 | `Test Files 4 passed (4)`, `Tests 32 passed (32)` |
| E03 | `npm run build` | 0 | JS 472.30 kB (gzip 130.66 kB); verify-dist passed; `dist/` is 21 MB because of two DMG copies |
| E04 | `npm run sync` | 1 | Same failure as T07 |
| E05 | Temporary audit tests | 1 | `Tests 4 failed | 42 passed (46)` |
| E06 | `HIVEWORK_REPO_ROOT=<SB>/user3/hivework npm run sync` | 0 | `✓ Up-to-date catalog (345 agents, 25 skills, 8 employees, 17 tools, 18 divisions)`; no file changes |
| E07 | `curl -sIL …/hivework-app/releases/download/v0.4.0/Hivework.app.tar.gz` | 0 | `HTTP 404` (also 404 about 20 minutes earlier) |
| E08 | `curl` of `github.com/allanindrajith/hivework-app` | 0 | `HTTP 404` |
| E09 | `cmp public/Hivework.dmg public/downloads/Hivework.dmg` | 0 | Identical |
| E10 | `codesign -dv public/Hivework.dmg` | 1 | `code object is not signed at all` |
| E11 | `spctl -a -t open … public/Hivework.dmg` | 1 | `internal error in Code Signing subsystem` — inconclusive inside the sandbox |
| E12 | Asset URL resolution with Node `URL` | 0 | `/agents` → `/assets/index-*.js`; `/agents/` → `/agents/assets/index-*.js` |

## Tests that could not be performed

| Test | Why |
|---|---|
| `npm run dev`, any local HTTP preview, browser click-through | Sandbox blocks binding local ports |
| Real `npm run deploy` | Targets production hosting; needs private SSH config |
| Live `https://hivework.online` checks | Production; intentionally not contacted |
| Loading installed agents inside Claude Code, Codex, Cursor, others | Needs installed, authenticated apps; none on the simulated clean machine |
| `/hive-hire <slug>` | Needs a live agent session |
| Codex TOML parse | Python 3.9 lacks `tomllib` |
| Linux, Windows Git Bash, WSL | Only macOS was available |
| Outdated Node versions | Only Node 24 was available; the repo declares no minimum |
| DMG notarization, opening the app | `spctl` unusable in sandbox; launching GUI apps is blocked |
| Email forwarding in the deploy guide | External service, real mailboxes |
