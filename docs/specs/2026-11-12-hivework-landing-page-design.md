# Hivework (`hivework.online`) Landing Page Design Specification

## Overview

Build the official static landing page for **Hivework** (`https://hivework.online`) inside `app/`, compiling into a self-contained Namecheap upload folder (`app/dist/`) using relative `./` asset paths so it never lives at or pollutes the repository root or Namecheap `public_html/` root.

The landing page tells the Hivework story—how one canonical repository of 296 specialized `.md` agent personas across 18 divisions and 21 modular skills converts into native formats for **17 AI coding harnesses and models** (`tools.json`)—while attributing and linking directly to the creator's main site (`https://itsallan.me`) and routing visitor email through `hello@hivework.online` → `hello@itsallan.me`.

## Scope & Constraints

- **Target Domain:** `https://hivework.online` (Namecheap Shared Hosting / cPanel Addon Domain folder).
- **Creator Attribution & Email:**
  - Main site: `https://itsallan.me`
  - Primary branded contact: `hello@hivework.online` (configured via Namecheap Free Email Forwarding to `hello@itsallan.me`), paired with direct fallback `hello@itsallan.me` and one-click clipboard copy alongside `mailto:`.
  - Send-as caveat documented in deployment guide (`docs/deploy-hivework-online.md`): Namecheap Email Forwarding routes incoming mail only; replying as `@hivework.online` requires an external SMTP Send-As alias if desired.
- **Repository CI Boundaries:**
  - Source lives exclusively under `app/`, which is already ignored as a non-division folder in `scripts/check-divisions.sh` (`NON_DIVISION_DIRS`).
  - Zero `.md` files may be placed directly inside `app/` (`app/*.md`) so `scripts/check-runbooks.sh` (`git ls-files '*/*.md'`) never reads app docs as agent slugs.
  - The Namecheap upload and DNS/email guide lives at `docs/deploy-hivework-online.md` (`docs/` is excluded in both `check-divisions.sh` and `check-runbooks.sh`).
- **Configurable External Links (`app/src/data/site.ts`):**
  - Because the repository currently has no `git remote` configured, repository/social links (`repoUrl`, `githubUrl`, `xUrl`) live in a single typed `siteConfig` module. When `repoUrl` is empty, UI actions render local CLI commands (`./scripts/install.sh`) instead of broken 404 links.

## Architecture & Data Pipeline

### 1. Project Layout (`app/`)

```text
app/
├── index.html                    # Relative ./logo-icon.svg, Inter/JetBrains Mono fonts, metadata
├── package.json                  # React 19, Vite, TypeScript, lucide-react, Vitest, Testing Library
├── tsconfig.json
├── vite.config.ts                # base: './', relative asset output to app/dist/
├── public/                       # Synced copies of logo.svg & logo-icon.svg (gitignored; copied by sync-catalog.mjs)
├── scripts/
│   ├── sync-catalog.mjs          # Reads root tools.json, divisions.json, runbooks.json, disk counts
│   └── verify-dist.mjs           # Asserts app/dist/index.html uses relative ./ paths only
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── styles/
    │   └── tokens.css            # Strict DESIGN.md CSS custom properties & typography scale
    ├── data/
    │   ├── site.ts               # Domain, creator (itsallan.me), emails, optional repo/social URLs
    │   └── catalog.generated.json
    ├── lib/
    │   ├── clipboard.ts          # navigator.clipboard + textarea execCommand fallback
    │   └── cliBuilder.ts         # Deterministic ./scripts/install.sh command builder
    └── components/
        ├── HeaderNav.tsx
        ├── HeroSection.tsx
        ├── StorySection.tsx
        ├── ModelMatrix.tsx
        ├── WorkforceSection.tsx
        └── ContactFooter.tsx
```

### 2. Build-Time Catalog Sync (`app/scripts/sync-catalog.mjs`)

Runs automatically before `npm run dev` and `npm run build` (`predev` / `prebuild` or chained script):

1. Reads and validates `../tools.json`:
   - Extracts all 17 tools (`claude-code`, `codex`, `gemini-cli`, `copilot`, `qwen`, `cursor`, `opencode`, `osaurus`, `aider`, `antigravity`, `kimi`, `openclaw`, `windsurf`, `hermes`, `vibe`, `zcode`, `dsh`) sorted by `order`.
   - Preserves `id`, `label`, `short`, `kebab`, `accent`, `order`, `scope`, `detect`, `version`, `format`, `installKind`, `dest`.
2. Reads and validates `../divisions.json` + scans division directories on disk:
   - Computes exact `.md` agent file count per division (currently 296 across 18 divisions) and captures up to 4 sample agent display names/specialties per division from frontmatter (`name`, `description`).
3. Reads and validates `../strategy/runbooks.json`:
   - Extracts all 4 NEXUS runbooks (`startup-mvp`, `enterprise-feature`, `marketing-campaign`, `incident-response`) with `slug`, `title`, `mode`, `duration`, `summary`, and group/agent totals.
4. Counts modular skills in `../skills/` (currently 21 directories) and reviewer personas in `../agents/*.md` (currently 10 files).
5. Copies `../assets/logo.svg` and `../assets/logo-icon.svg` into `app/public/`.
6. Exits with non-zero status if any canonical file is missing, invalid JSON, or yields zero tools/divisions.

### 3. Namecheap Self-Contained Packaging (`app/dist/`)

- `vite.config.ts` sets `base: './'` so every generated `<script>`, `<link>`, and SVG asset path resolves relative to the uploaded folder (`./assets/...`, `./logo.svg`).
- `npm run build` chains `sync-catalog.mjs` → `tsc --noEmit` → `vite build` → `verify-dist.mjs`.
- `app/dist/` is the single ready-to-upload folder for Namecheap cPanel (`public_html/hivework.online/` or Addon Domain Document Root) without touching the repository root.
- `app/node_modules/`, `app/dist/`, and `app/public/` are ignored in `.gitignore` so local build artifacts never pollute git history or `check-divisions.sh`, while `app/src/data/catalog.generated.json` is committed (and refreshed on every `predev`/`prebuild`/`pretest`) so TypeScript type-checking works immediately on a fresh clone.

## Page Story, Components & User Flows

### 1. `HeaderNav`
- Displays the Circuit Hex horizontal lockup (`./logo.svg`), 4 smooth-scroll section links (`Story`, `Model Matrix`, `Workforce`, `Contact`), an external `itsallan.me` creator pill, and a primary amber CTA (`Connect Models`) scrolling to `#model-matrix`.
- Collapses cleanly on mobile (`375px`) without horizontal overflow.

### 2. `HeroSection`
- Headline + value proposition: one canonical agent swarm deployed into 17 native AI coding tools without vendor lock-in.
- Verified metric bar derived from `catalog.generated.json`: `296` Agents · `18` Divisions · `17` AI Harnesses · `21` Modular Skills.
- Interactive quick-start terminal (`./scripts/install.sh`, `./scripts/install.sh --skills`, `./scripts/convert.sh --parallel`) with one-click copy and `aria-live="polite"` feedback.

### 3. `StorySection` (Origin Story + `itsallan.me`)
- **Three-beat technical story:**
  1. *Why generic prompts drift:* Single system prompts collapse across frontend, security, infra, and QA boundaries.
  2. *Canonical Markdown + Elephant-Goldfish alignment:* 296 specialized personas, 10 isolated Goldfish reviewer personas (`agents/`), and 21 skills (`skills/`) act as versioned context.
  3. *Universal harness compilation:* `scripts/convert.sh` and `scripts/install.sh` translate one source file into Markdown, TOML, MDC, `SKILL.md`, `CONVENTIONS.md`, OpenClaw workspaces, or Hermes router plugins.
- **Creator Card (`Allan · itsallan.me`):** Explicitly showcases the builder's main site (`https://itsallan.me`) and direct email (`hello@itsallan.me`) as the home behind Hivework.

### 4. `ModelMatrix` (Interactive 17-Tool Connector)
- Filter pills by `installKind`: `All (17)`, `Per-Agent`, `Roster`, `Plugin`.
- Interactive 17-tool selector grid displaying tool label, `format` tag, and a subtle `8px` brand status dot (`tool.accent`) inside neutral `#171511` / `#2d2920` hairline cards.
- **Live Inspector Panel** for the selected tool:
  - Displays `installKind`, renderer `format`, supported scopes (`User` / `Project`), native destination templates (`dest.user`, `dest.project`), and CLI version check (`version.bin` + `version.args`).
  - Interactive mode toggles (`--skills`, `--link`, `--dry-run`, optional `--division <slug>`) powered by `cliBuilder.ts` producing a copy-ready `./scripts/install.sh` command matching real `scripts/install.sh` flags.

### 5. `WorkforceSection` & `ContactFooter`
- **Division Search & Explorer:** Live text filter over all 18 divisions (`divisions.json`), displaying agent counts, matching `lucide-react` icon + color dot, and representative agent names. Matching 0 results displays an explicit `"Reset filter"` button.
- **NEXUS Runbooks Row:** 4 cards from `strategy/runbooks.json` showing `mode`, `duration`, summary, and a copyable install command using real `scripts/install.sh` flags (`./scripts/install.sh --agent <core-roster-slugs>`).
- **Contact & Email Hub (`ContactFooter`):**
  - Primary branded email: `hello@hivework.online` (`mailto:hello@hivework.online` + one-click Copy button + clear note that mail routes to `hello@itsallan.me`).
  - Direct creator links: `https://itsallan.me` and `hello@itsallan.me` (`mailto:` + Copy button).
  - Footer metadata: MIT License + Hivework Circuit Hex icon (`./logo-icon.svg`).

## Visual Design & Accessibility

- **Design Tokens (`DESIGN.md`):**
  - Canvas `#0d0c0a`, soft surface `#171511`, hairline `#2d2920`, secondary hairline `#3d372b`.
  - Primary amber `#f59e0b`, soft hover `#fbbf24`, deep active `#d97706`, on-primary `#0d0c0a` (11.4:1 contrast).
  - Typography: `Inter` for headings/prose, `JetBrains Mono` / `SF Mono` for commands, file paths, and metrics.
  - Strict constraint: No cold neon greens/blues as surface accents and no heavy blurry box-shadows; tool brand colors remain confined to `8px` status dots.
- **Accessibility & Motion:**
  - Keyboard-accessible buttons/tabs with visible `#fbbf24` focus rings and `aria-pressed` state on tool/filter selectors.
  - `prefers-reduced-motion: reduce` disables hover/transition animations.

## Error Handling

- **Pre-build validation failure:** `sync-catalog.mjs` throws descriptive errors and exits `1` if `tools.json`, `divisions.json`, `runbooks.json`, or `assets/logo*.svg` are missing or malformed.
- **Relative-path build guard:** `verify-dist.mjs` inspects `app/dist/index.html` and fails the build if root-anchored `/assets/` or `/logo` URLs appear.
- **Clipboard fallback:** `copyText()` catches `navigator.clipboard` rejections (common on HTTP or restricted previews) and falls back to an offscreen `<textarea>` + `document.execCommand('copy')`, surfacing clear visual feedback in both success and failure states.
- **Empty search state:** Division search returning 0 items shows `"No divisions match '<query>'"` plus a one-click `"Reset filter"` button.

## Verification & Testing Plan

1. **Automated Unit Tests (`Vitest` in `app/`):**
   - `sync-catalog` output validation (`17` tools, `18` divisions, `296` agents, `21` skills, `10` reviewer personas, `4` runbooks).
   - `cliBuilder.ts` flag composition (`--tool`, `--division`, `--skills`, `--link`, `--dry-run`) matched against real `scripts/install.sh` CLI syntax.
   - `clipboard.ts` success and fallback paths.
   - `ModelMatrix` and `WorkforceSection` component tests (tool switching, scope/path rendering, search filtering, reset empty state).
2. **Production Bundle & Relative Path Verification:**
   - Run `npm run build` in `app/` (executing `sync-catalog.mjs` → `tsc --noEmit` → `vite build` → `verify-dist.mjs`) and confirm `app/dist/` is self-contained with `./` relative paths only.
3. **Repository Regression Checks:**
   - Run `./scripts/check-divisions.sh` and `./scripts/check-runbooks.sh` from repo root and confirm exit code `0`.
4. **Local Static Preview Check:**
   - Serve `app/dist/` over HTTP and verify desktop (`1440px`) and mobile (`375px`) layout, interactive 17-tool switching, division search, copy actions, and zero browser console errors.
