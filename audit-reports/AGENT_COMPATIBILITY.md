# AI Agent Compatibility — Hivework-web

## What was and was not tested

This repository is a website. It has no agent configuration, no MCP server, no tool registration and no authentication of its own. Its role in agent integration is to hand visitors shell commands that run the installer in the separate `hivework` repo.

Two levels of evidence exist, and they are kept apart below:

- **File-level (tested):** the command was executed on a simulated clean machine, the exit code was captured, and the files written were counted and structurally checked.
- **Runtime (not tested):** whether the agent application then discovers and uses those files. No agent application was installed or logged in on the simulated machine, so this is UNTESTED for every tool.

No compatibility claim below goes beyond file-level evidence.

One direct piece of agent evidence: this audit was performed by an AI coding agent (Claude Code) driving the commands through its shell tool with no terminal attached. Every site command completed without prompting for input, so agents can run them unattended.

## Per-tool results (public head `c232a83`)

Command: `<clone>/scripts/install.sh --tool <id> --skills`, fresh home directory per tool.

| Tool | Exit | Where files landed | Agents | Skills (25) | File-level | Runtime |
|---|---|---|---|---|---|---|
| Claude Code | 0 | `~/.claude/agents`, `~/.claude/skills` | 345 | installed | PASS | UNTESTED |
| Codex | 0 | `~/.codex/agents` (TOML), `~/.codex/skills` | 345 | installed | PASS | UNTESTED |
| Cursor | 0 | `.cursor/rules` in current directory | 345 | skipped | PARTIAL | UNTESTED |
| OpenCode | 0 | `.opencode/agents` in current directory | 345 | skipped | PARTIAL | UNTESTED |
| Antigravity | 0 | `~/.gemini/config/skills` | 345 as skills | installed | PASS | UNTESTED |
| Gemini CLI | 0 | `~/.gemini/agents` | 345 | skipped | PASS | UNTESTED |
| Copilot | 0 | `~/.github/agents`, `~/.copilot/agents` | 345 ×2 | skipped | PASS | UNTESTED |
| Qwen Code | 0 | `.qwen/agents` in current directory | 345 | skipped | PARTIAL | UNTESTED |
| Aider | 0 | `CONVENTIONS.md` in current directory | 1 roster file | skipped | PARTIAL | UNTESTED |
| Windsurf | 0 | `.windsurfrules` in current directory | 1 roster file | skipped | PARTIAL | UNTESTED |
| Osaurus | 0 | `~/.osaurus/skills` | 345 as skills | installed | PASS | UNTESTED |
| DSH | 0 | `~/.dsh/skills` | 345 as skills | installed | PASS | UNTESTED |
| Kimi Code | 0 | `~/.config/kimi/agents` | 690 files | skipped | PASS | UNTESTED |
| OpenClaw | 0 | `~/.openclaw/hivework` | 1035 files | skipped | PASS | UNTESTED |
| Hermes | 0 | `~/.hermes/plugins/hive-agents-router` | plugin, 4 files | skipped | PASS | UNTESTED |
| Mistral Vibe | 0 | `~/.vibe/agents`, `~/.vibe/prompts` | 690 files | skipped | PASS | UNTESTED |
| ZCode | 0 | `~/.zcode/agents` | 345 | skipped | PASS | UNTESTED |

PARTIAL for the five current-directory tools refers to HW-004: used through the site's bootstrap one-liner, the files land inside the cloned repo.

## Detail for the agents named in the brief

### Claude Code — file-level PASS, runtime UNTESTED

- 345 agent files, each with `name` and `description` frontmatter; no duplicate names.
- 25 `SKILL.md` files with `name` and `description`, including `hive-hire`.
- `--link` mode creates symlinks back into the clone (129 for one division plus skills).
- Known gaps: the 10 reviewer agents are not installed by any command the site offers (HW-002). The site's hive-hire command fails (HW-001); `--skills` is the working route.
- Sandboxed agent sessions: `convert.sh` fails with `mktemp: mkstemp failed` when the macOS user temp folder is not writable (OBS-C). Installs that need auto-conversion then stop with `convert.sh failed; run it manually`. Outside a sandbox this does not occur.

### OpenAI Codex — file-level PASS, runtime UNTESTED

- 345 `.toml` agent files and 25 skill folders written.
- TOML validity was not checked (no TOML parser on the test machine).

### Cursor — file-level PARTIAL, runtime UNTESTED

- 345 `.mdc` rule files with `description` frontmatter.
- Skills are not supported; the installer says so and continues.
- The site claims hive-hire installs into Cursor. It does not (HW-003).
- Must be run from the user's project root. The bootstrap one-liner does not do that (HW-004).

### OpenCode — file-level PARTIAL, runtime UNTESTED

- 345 agent files written to `.opencode/agents`.
- The installer prints: `opencode: registers only ~119 agents (upstream bug anomalyco/opencode#27988)`. This is the installer's statement and was not independently verified.
- Same two site issues as Cursor (HW-003, HW-004).

### Standard terminal

- bash 3.2 on macOS: works.
- `sh`: fails with a syntax error; bash is required.
- No terminal attached: works, the wizard is skipped automatically.
- Linux, Windows Git Bash, WSL: UNTESTED.

## Checklist from the brief

| Item | Result |
|---|---|
| Agent installation instructions | Site only; there is no written guide in this repo. Commands are copy buttons |
| CLI accessibility | `./scripts/install.sh` requires the working directory to be the clone, or a path to the script |
| Command discovery | `--help` and `--list tools|teams|agents` work |
| Configuration compatibility | 17 of 17 tool ids on the site are accepted by the installer |
| Agent-specific configuration files | Written in each tool's own format; structure verified for 6 tools |
| Tool registration | Hermes plugin files are written; registration with a running Hermes is UNTESTED |
| MCP server integration | Not applicable to this repo. The site references no MCP commands |
| Authentication | None required by any site command. Cloning needs anonymous GitHub access only |
| Local permissions | Writes to the home directory or the current directory; an unwritable home fails cleanly |
| Working-directory requirements | Critical for Cursor, OpenCode, Qwen, Aider, Windsurf (HW-004) |
| Environment variables | Optional overrides only (`CLAUDE_CONFIG_DIR`, `CODEX_AGENTS_DIR`, and others listed in `--help`). None required |
| Tool invocation / agent-to-CLI communication | Commands run unattended from an agent shell; exit codes are meaningful except `--tool` with no value (exits 0) |
| Error messages returned to the agent | Clear and actionable for unknown tool, division, agent, option |
| End-to-end documented workflow | Agents and skills: works. Employees via hive-hire: broken at the first command (HW-001). `/hive-hire <slug>`: UNTESTED |

## What would close the UNTESTED gaps

1. On a machine with Claude Code installed: run the install, start a session, list agents, invoke one agent and `/hive-hire gtm-engineer`. About 10 minutes.
2. Repeat for Codex and Cursor. About 10 minutes each.
3. Validate Codex TOML with Python 3.11+: `python3 -c "import tomllib,glob;[tomllib.load(open(f,'rb')) for f in glob.glob('~/.codex/agents/*.toml')]"`. About 1 minute.
