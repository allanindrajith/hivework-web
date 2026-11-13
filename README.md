# Hivework Web

> The official web operator hub for [Hivework](https://hivework.online) — One canonical AI workforce across every coding harness.

[![Live Website](https://img.shields.io/badge/Live-hivework.online-f59e0b?style=flat-square&logo=google-chrome&logoColor=white)](https://hivework.online)
[![Test Suite](https://img.shields.io/badge/Tests-49%20Passing-emerald?style=flat-square&logo=vitest&logoColor=white)](https://github.com/allanindrajith/hivework-web)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-zinc?style=flat-square)](LICENSE)

---

## About Hivework

**Hivework Web** is the open-source client application powering [hivework.online](https://hivework.online). It serves as the live catalog, discovery engine, and interactive installation hub for the Hivework AI workforce repository ([allanindrajith/hivework](https://github.com/allanindrajith/hivework)).

Instead of maintaining brittle, monolithic prompts that collapse across large codebases, Hivework defines specialized, version-controlled Markdown personas, modular `SKILL.md` workflows, and context-isolated Goldfish reviewers that compile natively into every major AI developer harness.

### Catalog Totals (Verified)

| Metric | Count | Description |
|---|---|---|
| **Specialized Agents** | `345` | Role-specific Markdown personas across software engineering, architecture, QA, security, and game development |
| **Workforce Divisions** | `18` | Structured departments ensuring clean task boundaries and domain mastery |
| **Modular Skills** | `25` | Reusable cross-tool `SKILL.md` procedural recipes |
| **AI Employees** | `8` | Autonomous end-to-end multi-agent personas |
| **Goldfish Reviewers** | `10` | Fresh-context, zero-bias code reviewers |
| **Supported Harnesses** | `17` | Claude Code, Cursor, Antigravity, Codex, OpenCode, Gemini CLI, Copilot, and 10+ local tools |

---

## Core Features

- **Interactive Model Matrix**: Live compatibility matrix filtering 17 AI developer harnesses by installation type, CLI flags, configuration paths, and supported formats.
- **Workforce Explorer & Selection Cart**: Search and filter 345 agents across 18 divisions with pagination, live tag filtering, and a multi-agent cart that dynamically composes custom `./scripts/install.sh` installation commands.
- **Modular Skills & Reviewers**: Directory of 25 cross-tool skills and 10 Goldfish review personas with direct GitHub repository links.
- **Autonomous AI Employees**: Dedicated section for 8 autonomous employee roles (`hive-hire`).
- **Apple-Grade Hardware-Accelerated Design**: Obsidian and Honeycomb Amber design system with GPU-composited 120Hz entrance sequences, ambient radial glows, and responsive terminal components.
- **Desktop Companion App**: Built-in distribution and auto-update metadata channel for Hivework macOS app (`Hivework.dmg` with Sparkle/updater support).

---

## Design System & Craft

Hivework Web follows a restrained, high-signal developer aesthetic:

- **Color Palette**: Obsidian Canvas (`#0d0c0a`, `#171511`) accented with Honeycomb Amber (`#f59e0b`, `#fbbf24`, `#d97706`).
- **Typography**: Inter for editorial legibility; JetBrains Mono / SF Mono for terminal commands, flags, and catalog metrics.
- **Performance**: Zero runtime CSS animation libraries — all transitions run on GPU compositor layers (`translate3d`, `opacity`, `will-change`) with full support for `@media (prefers-reduced-motion: reduce)`.
- **Preloader Sequence**: A non-blocking 2px amber laser progress indicator paired with a stepped 850ms element arrival cadence.

---

## Project Structure

```text
hivework-web/
├── docs/                      # Architectural specs, audit reports & deploy guides
│   ├── deploy-hivework-online.md
│   ├── plans/
│   └── specs/
├── public/                    # Static public assets, downloads & updater config
│   ├── downloads/             # Hivework macOS DMG and update bundles
│   └── updater.json           # Sparkle auto-update feed
├── scripts/                   # Catalog synchronization & deployment verifications
│   ├── sync-catalog.mjs       # Extracts canonical data from main Hivework repo
│   └── verify-dist.mjs        # Production asset integrity checker
├── src/
│   ├── components/            # React UI components
│   │   ├── ContactFooter.tsx  # Direct creator contact & email forwarder
│   │   ├── EmployeesSection.tsx # Autonomous AI employee cards
│   │   ├── HeaderNav.tsx      # Clean-path navigational header
│   │   ├── HeroSection.tsx    # Hero showcase with quick-start terminal
│   │   ├── ModelMatrix.tsx    # 17-tool compatibility matrix
│   │   ├── SkillsSection.tsx  # 25 skills and 10 Goldfish reviewers
│   │   ├── StorySection.tsx   # Origin story and architecture breakdown
│   │   └── WorkforceSection.tsx # Searchable 345-agent catalog
│   ├── data/                  # Types, site config, and generated catalog
│   │   └── catalog.generated.json
│   ├── styles/                # CSS design system (tokens, landing, sections)
│   └── __tests__/             # Vitest component & unit test suites
└── vite.config.ts             # Vite configuration
```

---

## Local Development

### Requirements

- Node.js 22.12+ or 24+
- npm 10+
- (Optional) Local clone of [allanindrajith/hivework](https://github.com/allanindrajith/hivework) for running catalog synchronizations

### Quick Start

```bash
# 1. Install dependencies
npm ci

# 2. Run the test suite
npm test

# 3. Start local development server (http://localhost:5173)
npm run dev

# 4. Compile and verify production build
npm run build
```

---

## Scripts & Automation

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server with HMR |
| `npm test` | Runs the full Vitest suite (49 unit and integration tests) |
| `npm run test:coverage` | Generates V8 code coverage reports |
| `npm run build` | Runs TypeScript type checking (`tsc --noEmit`), bundles with Vite, and runs `verify-dist.mjs` |
| `npm run sync` | Pulls catalog metrics, agents, skills, and logos from the main `hivework` repository |
| `npm run sync:desktop` | Synchronizes catalog data and copies updated macOS desktop builds from `../Hivework-app` |
| `npm run deploy` | Runs tests, compiles dist, and deploys via `rsync` to live `cpanel` production host |

---

## About the Author & Maintainer

Designed, engineered, and maintained by **Allan Indrajith**.

- **Portfolio**: [itsallan.me](https://itsallan.me)
- **Email**: [hello@itsallan.me](mailto:hello@itsallan.me) / [hello@hivework.online](mailto:hello@hivework.online)
- **GitHub**: [@allanindrajith](https://github.com/allanindrajith)

---

## License

MIT © [Allan Indrajith](https://itsallan.me)
