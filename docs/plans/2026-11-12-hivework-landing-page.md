# Hivework (`hivework.online`) Landing Page Implementation Plan

> **Historical — do not execute.** Written when the site lived in `app/` inside the main Hivework repo. Paths like `app/src/…` and the `git add app/…` steps no longer exist. For current setup see `README.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the static Hivework landing page (`https://hivework.online`) inside `app/`, compiled into a self-contained Namecheap-ready upload folder (`app/dist/`) showcasing the story, all 17 AI harness connections, 18 divisions, `itsallan.me`, and `hello@hivework.online` → `hello@itsallan.me`.

**Architecture:** Isolate a Vite + React + TypeScript application inside `app/` (excluded by `scripts/check-divisions.sh`) backed by a pre-build Node script (`app/scripts/sync-catalog.mjs`) that reads live repository JSON/markdown metadata into `app/src/data/catalog.generated.json` and copies SVGs from `assets/`. Configure Vite with `base: './'` and verify post-build HTML via `app/scripts/verify-dist.mjs` so `app/dist/` works cleanly inside any Namecheap Addon Domain folder or preview subdirectory.

**Tech Stack:** Vite, React 19, TypeScript, Vitest, Testing Library (`@testing-library/react`, `jsdom`), `lucide-react`, pure CSS custom properties (`DESIGN.md` tokens).

**Spec:** [docs/superpowers/specs/2026-11-12-hivework-landing-page-design.md](../specs/2026-11-12-hivework-landing-page-design.md)

## Global Constraints

- Domain & creator links: `https://hivework.online`, `https://itsallan.me`, `hello@hivework.online` forwarding to `hello@itsallan.me` (with direct `hello@itsallan.me` fallback).
- Zero `.md` files placed directly under `app/` (`app/*.md`) so `scripts/check-runbooks.sh` never scans app files as agent slugs.
- Output bundle `app/dist/` must use relative `./` asset URLs (`base: './'`); zero root-anchored `/assets/` or `/logo` links in `app/dist/index.html`.
- Design palette locked to `DESIGN.md`: `#0d0c0a` canvas, `#171511` soft surface, `#2d2920` 1px warm hairlines, `#f59e0b` amber (`#0d0c0a` ink), `Inter` + `JetBrains Mono` / `SF Mono`; tool accents restricted to `8px` dots; zero cold neon backgrounds or heavy blurry shadows.
- Ignore `app/public/` in `.gitignore` (`node_modules/` and `dist/` are already ignored); commit `app/src/data/catalog.generated.json`.
- Configurable `repoUrl` in `app/src/data/site.ts`: omit GitHub/repo buttons when empty rather than rendering broken links.

## Review Focus

- Non-HTTPS `navigator.clipboard` rejection during Namecheap preview falls back cleanly to offscreen `<textarea>` + `execCommand('copy')` (`utilities.test.ts`).
- Root-anchored `/assets/` or `/logo` URLs in `app/dist/index.html` fail `verifyDistHtml()` immediately (`syncCatalog.test.ts` + `verify-dist.mjs`).
- Zero-match division search renders explicit empty state with `"Reset filter"` button rather than a blank container (`interactiveSections.test.tsx`).
- Empty `repoUrl` in `siteConfig` never renders broken `href=""` or `href="#"` anchor links (`heroStory.test.tsx`).
- Missing or malformed `tools.json` / `divisions.json` / `runbooks.json` throws non-zero in `buildCatalog()` before Vite compiles (`syncCatalog.test.ts`).

---

### Task 1: App Scaffolding, Build Config & Catalog Sync Scripts

**Files:**
- Modify: `.gitignore`
- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/vite.config.ts`
- Create: `app/src/__tests__/setup.ts`
- Create: `app/scripts/sync-catalog.mjs`
- Create: `app/scripts/verify-dist.mjs`
- Create: `app/src/data/catalog.generated.json`
- Test: `app/src/__tests__/syncCatalog.test.ts`

**Interfaces:**
- Consumes: Root `tools.json`, `divisions.json`, `strategy/runbooks.json`, `assets/logo.svg`, `assets/logo-icon.svg`, division `.md` files, `skills/`, `agents/*.md`
- Produces:
  - `buildCatalog(repoRoot: string): CatalogData` in `app/scripts/sync-catalog.mjs`
  - `syncCatalog(repoRoot?: string): CatalogData` in `app/scripts/sync-catalog.mjs`
  - `verifyDistHtml(html: string): void` in `app/scripts/verify-dist.mjs`
  - `CatalogData` JSON structure in `app/src/data/catalog.generated.json`: `{ generatedAt: string, totals: { agents: number, divisions: number, tools: number, skills: number, reviewers: number, runbooks: number }, tools: ToolEntry[], divisions: DivisionEntry[], runbooks: RunbookEntry[] }`

- [ ] **Step 1: Add `app/public/` to `.gitignore` and scaffold `app/package.json`, `app/tsconfig.json`, `app/vite.config.ts`, `app/src/__tests__/setup.ts`**

Add `app/public/` under the Node/build section of `.gitignore`. Create `app/package.json` (`dependencies`: `react`, `react-dom`, `lucide-react`; `devDependencies`: `vite`, `@vitejs/plugin-react`, `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`) with scripts:
- `"sync": "node scripts/sync-catalog.mjs"`
- `"predev": "npm run sync"`
- `"dev": "vite"`
- `"prebuild": "npm run sync"`
- `"build": "tsc --noEmit && vite build && node scripts/verify-dist.mjs"`
- `"pretest": "npm run sync"`
- `"test": "vitest run"`
Create `app/tsconfig.json` (`strict: true`, `jsx: "react-jsx"`, `resolveJsonModule: true`, `types: ["vitest/globals", "node"]`), `app/src/__tests__/setup.ts` (`import '@testing-library/jest-dom/vitest';`), and `app/vite.config.ts` (`base: './'`, `@vitejs/plugin-react`, `test: { environment: 'jsdom', globals: true, setupFiles: ['./src/__tests__/setup.ts'] }`).

- [ ] **Step 2: Write the failing tests in `app/src/__tests__/syncCatalog.test.ts`**

```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildCatalog } from '../../scripts/sync-catalog.mjs';
import { verifyDistHtml } from '../../scripts/verify-dist.mjs';

const REPO_ROOT = path.resolve(__dirname, '../../..');

describe('sync-catalog', () => {
  it('extracts exact verified repo catalog totals sorted cleanly', () => {
    const data = buildCatalog(REPO_ROOT);
    expect(data.totals).toEqual({
      agents: 296,
      divisions: 18,
      tools: 17,
      skills: 21,
      reviewers: 10,
      runbooks: 4,
    });
    expect(data.tools.map((t) => t.order)).toEqual(
      Array.from({ length: 17 }, (_, i) => i + 1)
    );
    expect(data.divisions[0]).toHaveProperty('samples');
  });

  it('throws descriptive error when tools.json or divisions.json is missing', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hivework-missing-'));
    expect(() => buildCatalog(tmpDir)).toThrow(/tools\.json/);
  });
});

describe('verifyDistHtml', () => {
  it('accepts relative ./ assets and rejects root-anchored /assets/ or /logo links', () => {
    expect(() =>
      verifyDistHtml('<link rel="icon" href="./logo-icon.svg"><script src="./assets/index.js"></script>')
    ).not.toThrow();
    expect(() =>
      verifyDistHtml('<script src="/assets/index.js"></script>')
    ).toThrow(/relative/i);
  });
});
```

- [ ] **Step 3: Install dependencies in `app/` and run test to verify it fails**

Run: `cd app && npm install && npx vitest run src/__tests__/syncCatalog.test.ts` (note: remove/skip `pretest` or create empty stubs first if `pretest` invokes missing script; better: run `npx vitest run` directly before creating script!).
Expected: FAIL with missing `../../scripts/sync-catalog.mjs` / `../../scripts/verify-dist.mjs`.

- [ ] **Step 4: Implement `app/scripts/sync-catalog.mjs` and `app/scripts/verify-dist.mjs`**

In `app/scripts/sync-catalog.mjs`:
- Export `buildCatalog(repoRoot)` and `syncCatalog(repoRoot = path.resolve(__dirname, '../..'))`.
- Validate `tools.json`, `divisions.json`, `strategy/runbooks.json`, `assets/logo.svg`, and `assets/logo-icon.svg` exist and parse cleanly; throw descriptive error if any key is missing or array/object is empty.
- Walk each division directory (`divisions.json`) recursively for `.md` files, parsing YAML frontmatter `name` and `description` for up to 4 sample agents per division.
- Count subdirectories in `skills/` containing `SKILL.md` (or directory entries excluding dotfiles) and `.md` files in `agents/`.
- When `syncCatalog()` runs (and when executed directly as CLI `import.meta.url`), write `app/src/data/catalog.generated.json` (2-space indented JSON) and copy `assets/logo.svg` + `assets/logo-icon.svg` into `app/public/`.
In `app/scripts/verify-dist.mjs`:
- Export `verifyDistHtml(html)` checking `/(href|src)=["']\/(assets|logo)/i` throws an Error mentioning relative `./` paths, and verify `app/dist/index.html` when executed as CLI.

- [ ] **Step 5: Run `npm run sync` and `npx vitest run src/__tests__/syncCatalog.test.ts` to verify pass**

Run: `cd app && npm run sync && npx vitest run src/__tests__/syncCatalog.test.ts`
Expected: PASS (3 tests passing, `app/src/data/catalog.generated.json` created with 17 tools, 18 divisions, 296 agents).

- [ ] **Step 6: Commit Task 1**

```bash
git add .gitignore app/package.json app/tsconfig.json app/vite.config.ts app/src/__tests__/setup.ts app/scripts/sync-catalog.mjs app/scripts/verify-dist.mjs app/src/data/catalog.generated.json app/src/__tests__/syncCatalog.test.ts
git commit -m "feat(app): scaffold Vite workspace and catalog sync pipeline"
```

---

### Task 2: Design Tokens, Site Config, Types & Pure Utilities

**Files:**
- Create: `app/index.html`
- Create: `app/src/styles/tokens.css`
- Create: `app/src/data/types.ts`
- Create: `app/src/data/site.ts`
- Create: `app/src/lib/clipboard.ts`
- Create: `app/src/lib/cliBuilder.ts`
- Test: `app/src/__tests__/utilities.test.ts`

**Interfaces:**
- Consumes: `CatalogData` JSON structure from `app/src/data/catalog.generated.json`
- Produces:
  - `ToolEntry`, `DivisionEntry`, `RunbookEntry`, `CatalogData`, `CliOptions` in `app/src/data/types.ts`
  - `siteConfig` (`domain: 'hivework.online'`, `siteUrl: 'https://hivework.online'`, `creatorName: 'Allan'`, `creatorUrl: 'https://itsallan.me'`, `primaryEmail: 'hello@hivework.online'`, `forwardTargetEmail: 'hello@itsallan.me'`, `repoUrl: ''`, `xUrl: ''`) in `app/src/data/site.ts`
  - `copyText(text: string): Promise<boolean>` in `app/src/lib/clipboard.ts`
  - `buildInstallCommand(opts: CliOptions): string` and `buildRunbookCommand(agents: string[]): string` in `app/src/lib/cliBuilder.ts`

- [ ] **Step 1: Write the failing tests in `app/src/__tests__/utilities.test.ts`**

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteConfig } from '../data/site';
import { buildInstallCommand, buildRunbookCommand } from '../lib/cliBuilder';
import { copyText } from '../lib/clipboard';

describe('siteConfig', () => {
  it('pins canonical domain, creator site, and forwarding email addresses', () => {
    expect(siteConfig.domain).toBe('hivework.online');
    expect(siteConfig.creatorUrl).toBe('https://itsallan.me');
    expect(siteConfig.primaryEmail).toBe('hello@hivework.online');
    expect(siteConfig.forwardTargetEmail).toBe('hello@itsallan.me');
  });
});

describe('cliBuilder', () => {
  it('builds install.sh commands matching real tool, division, skills, link, and dry-run flags', () => {
    expect(buildInstallCommand({ tool: 'all' })).toBe('./scripts/install.sh');
    expect(
      buildInstallCommand({
        tool: 'claude-code',
        division: 'engineering',
        skills: true,
        link: true,
        dryRun: true,
      })
    ).toBe('./scripts/install.sh --tool claude-code --division engineering --skills --link --dry-run');
  });

  it('builds runbook command using comma-separated --agent slugs', () => {
    expect(buildRunbookCommand(['hive-agents-orchestrator', 'hive-frontend-developer'])).toBe(
      './scripts/install.sh --agent hive-agents-orchestrator,hive-frontend-developer'
    );
  });
});

describe('copyText', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses navigator.clipboard when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    expect(await copyText('hello@hivework.online')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello@hivework.online');
  });

  it('falls back to execCommand when navigator.clipboard rejects (HTTP preview)', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
    });
    document.execCommand = vi.fn().mockReturnValue(true);
    expect(await copyText('hello@itsallan.me')).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd app && npm test -- src/__tests__/utilities.test.ts`
Expected: FAIL with module-not-found errors for `site`, `cliBuilder`, `clipboard`.

- [ ] **Step 3: Implement `index.html`, `tokens.css`, `types.ts`, `site.ts`, `clipboard.ts`, `cliBuilder.ts`**

- `app/index.html`: `<link rel="icon" href="./logo-icon.svg" type="image/svg+xml" />`, Google Fonts `Inter` (400,600,700) & `JetBrains Mono` (400,600), canonical `https://hivework.online`, OG title/description, `<script type="module" src="./src/main.tsx"></script>`.
- `app/src/styles/tokens.css`: Define all `DESIGN.md` tokens (`--canvas: #0d0c0a`, `--canvas-soft: #171511`, `--canvas-text-soft: #fdfbf7`, `--hairline: #2d2920`, `--hairline-soft: #3d372b`, `--primary: #f59e0b`, `--primary-soft: #fbbf24`, `--primary-deep: #d97706`, `--on-primary: #0d0c0a`, `--ink-strong: #ffffff`, `--ink: #f7f5f0`, `--body: #c2beb5`, `--mute: #8c867a`), `.btn-primary`, `.btn-outline`, `.hairline-card`, `.terminal-window`, `.pill-badge`, responsive grid helpers (`375px` to `1440px`), visible `:focus-visible` `#fbbf24` outline, and `@media (prefers-reduced-motion: reduce)`.
- `app/src/data/types.ts` & `app/src/data/site.ts`: Typed catalog interfaces + `siteConfig`.
- `app/src/lib/clipboard.ts`: Try `navigator.clipboard?.writeText(text)`; on throw/missing, mount hidden readonly `<textarea>`, `select()`, call `document.execCommand('copy')`, remove element, return boolean.
- `app/src/lib/cliBuilder.ts`: Deterministic flag ordering (`--tool`, `--division`, `--skills`, `--link`, `--dry-run`) omitting `--tool` when `'all'`; `buildRunbookCommand(agents)` joins non-empty unique slugs with `,`.

- [ ] **Step 4: Run tests to verify pass**

Run: `cd app && npm test -- src/__tests__/utilities.test.ts`
Expected: PASS (5 tests passing).

- [ ] **Step 5: Commit Task 2**

```bash
git add app/index.html app/src/styles/tokens.css app/src/data/types.ts app/src/data/site.ts app/src/lib/clipboard.ts app/src/lib/cliBuilder.ts app/src/__tests__/utilities.test.ts
git commit -m "feat(app): add DESIGN.md tokens, site config, clipboard fallback, and CLI builder"
```

---

### Task 3: Header, Hero & Story + `itsallan.me` Components

**Files:**
- Create: `app/src/components/HeaderNav.tsx`
- Create: `app/src/components/HeroSection.tsx`
- Create: `app/src/components/StorySection.tsx`
- Test: `app/src/__tests__/heroStory.test.tsx`

**Interfaces:**
- Consumes: `CatalogData`, `SiteConfig` from `types.ts`, `copyText()` from `clipboard.ts`, `siteConfig` from `site.ts`
- Produces:
  - `HeaderNav({ site }: { site: SiteConfig })`
  - `HeroSection({ totals, site }: { totals: CatalogData['totals']; site: SiteConfig })`
  - `StorySection({ totals, site }: { totals: CatalogData['totals']; site: SiteConfig })`

- [ ] **Step 1: Write the failing tests in `app/src/__tests__/heroStory.test.tsx`**

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import catalog from '../data/catalog.generated.json';
import { siteConfig } from '../data/site';
import { HeaderNav } from '../components/HeaderNav';
import { HeroSection } from '../components/HeroSection';
import { StorySection } from '../components/StorySection';

describe('HeaderNav, HeroSection, and StorySection', () => {
  it('renders verified catalog numbers and never renders empty repo anchor links', () => {
    render(
      <>
        <HeaderNav site={{ ...siteConfig, repoUrl: '' }} />
        <HeroSection totals={catalog.totals} site={{ ...siteConfig, repoUrl: '' }} />
      </>
    );
    expect(screen.getByText('296')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /itsallan\.me/i }).length).toBeGreaterThan(0);
    const links = screen.getAllByRole('link');
    links.forEach((a) => expect(a.getAttribute('href')).not.toBe(''));
    links.forEach((a) => expect(a.getAttribute('href')).not.toBe('#'));
  });

  it('switches hero quick-start terminal tabs and shows copy confirmation', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<HeroSection totals={catalog.totals} site={siteConfig} />);
    fireEvent.click(screen.getByRole('button', { name: /Install Skills/i }));
    expect(screen.getByText(/--skills/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Copy command/i }));
    await waitFor(() => expect(screen.getByText(/Copied/i)).toBeInTheDocument());
  });

  it('displays origin story and Allan creator card with itsallan.me and hello@itsallan.me', () => {
    render(<StorySection totals={catalog.totals} site={siteConfig} />);
    expect(screen.getByRole('link', { name: /itsallan\.me/i })).toHaveAttribute('href', 'https://itsallan.me');
    expect(screen.getByRole('link', { name: /hello@itsallan\.me/i })).toHaveAttribute('href', 'mailto:hello@itsallan.me');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `cd app && npm test -- src/__tests__/heroStory.test.tsx`
Expected: FAIL (missing `HeaderNav`, `HeroSection`, `StorySection`).

- [ ] **Step 3: Implement `HeaderNav.tsx`, `HeroSection.tsx`, `StorySection.tsx`**

- `HeaderNav.tsx`: Sticky header using `./logo.svg` (`Hivework`), 4 anchor links (`#story`, `#model-matrix`, `#workforce`, `#contact`), external badge link to `site.creatorUrl` (`itsallan.me`), conditional `site.repoUrl` link only when non-empty, primary amber CTA (`#model-matrix`).
- `HeroSection.tsx`: Eyebrow (`HIVEWORK · HIVEWORK.ONLINE`), display headline, value prop, 4-stat bar (`totals.agents`, `totals.divisions`, `totals.tools`, `totals.skills`), and terminal window switching between `Install All` (`./scripts/install.sh`), `Install Skills` (`./scripts/install.sh --skills`), and `Convert All` (`./scripts/convert.sh --parallel`) with accessible `aria-live="polite"` copy confirmation.
- `StorySection.tsx`: 3-step story grid (*01. Single-Prompt Drift* → *02. Canonical Markdown + Goldfish Review* → *03. Native Compilation via `convert.sh`*) plus Creator Card spotlighting `site.creatorName` (`Allan`), `site.creatorUrl` (`https://itsallan.me`), and `site.forwardTargetEmail` (`hello@itsallan.me`).

- [ ] **Step 4: Run test to verify pass**

Run: `cd app && npm test -- src/__tests__/heroStory.test.tsx`
Expected: PASS (3 tests passing).

- [ ] **Step 5: Commit Task 3**

```bash
git add app/src/components/HeaderNav.tsx app/src/components/HeroSection.tsx app/src/components/StorySection.tsx app/src/__tests__/heroStory.test.tsx
git commit -m "feat(app): add HeaderNav, HeroSection, and StorySection with itsallan.me"
```

---

### Task 4: Interactive 17-Model Matrix, Workforce Explorer, Contact Footer & Root App

**Files:**
- Create: `app/src/components/ModelMatrix.tsx`
- Create: `app/src/components/WorkforceSection.tsx`
- Create: `app/src/components/ContactFooter.tsx`
- Create: `app/src/App.tsx`
- Create: `app/src/main.tsx`
- Test: `app/src/__tests__/interactiveSections.test.tsx`

**Interfaces:**
- Consumes: `CatalogData`, `SiteConfig`, `copyText()`, `buildInstallCommand()`, `buildRunbookCommand()`, `HeaderNav`, `HeroSection`, `StorySection`
- Produces:
  - `ModelMatrix({ tools, divisions }: { tools: ToolEntry[]; divisions: DivisionEntry[] })`
  - `WorkforceSection({ divisions, runbooks }: { divisions: DivisionEntry[]; runbooks: RunbookEntry[] })`
  - `ContactFooter({ site }: { site: SiteConfig })`
  - `App()` root component

- [ ] **Step 1: Write the failing tests in `app/src/__tests__/interactiveSections.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import catalog from '../data/catalog.generated.json';
import { siteConfig } from '../data/site';
import { ModelMatrix } from '../components/ModelMatrix';
import { WorkforceSection } from '../components/WorkforceSection';
import { ContactFooter } from '../components/ContactFooter';

describe('ModelMatrix', () => {
  it('filters 17 tools by installKind and updates inspector format, destination, and CLI flags', () => {
    render(<ModelMatrix tools={catalog.tools} divisions={catalog.divisions} />);
    fireEvent.click(screen.getByRole('button', { name: /Roster \(2\)/i }));
    expect(screen.getByRole('button', { name: /Aider/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Claude Code/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /All \(17\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /Codex/i }));
    expect(screen.getByText(/codex-toml/)).toBeInTheDocument();
    expect(screen.getByText(/--tool codex/)).toBeInTheDocument();
  });
});

describe('WorkforceSection', () => {
  it('renders empty state with Reset filter button on zero matches and restores all 18 divisions', () => {
    render(<WorkforceSection divisions={catalog.divisions} runbooks={catalog.runbooks} />);
    const input = screen.getByRole('searchbox', { name: /Search divisions/i });
    fireEvent.change(input, { target: { value: 'zzzz-no-match' } });
    expect(screen.getByText(/No divisions match/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reset filter/i }));
    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });
});

describe('ContactFooter', () => {
  it('exposes hello@hivework.online, forwarding note to hello@itsallan.me, and itsallan.me', () => {
    render(<ContactFooter site={siteConfig} />);
    expect(screen.getByRole('link', { name: /hello@hivework\.online/i })).toHaveAttribute(
      'href',
      'mailto:hello@hivework.online'
    );
    expect(screen.getByRole('link', { name: /hello@itsallan\.me/i })).toHaveAttribute(
      'href',
      'mailto:hello@itsallan.me'
    );
    expect(screen.getByRole('link', { name: /itsallan\.me/i })).toHaveAttribute('href', 'https://itsallan.me');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `cd app && npm test -- src/__tests__/interactiveSections.test.tsx`
Expected: FAIL (missing components).

- [ ] **Step 3: Implement `ModelMatrix.tsx`, `WorkforceSection.tsx`, `ContactFooter.tsx`, `App.tsx`, `main.tsx`**

- `ModelMatrix.tsx`: Filter pills (`All (17)`, `Per-Agent (14)`, `Roster (2)`, `Plugin (1)`), clickable tool selector buttons with `aria-pressed` and `8px` brand color dot (`tool.accent`), right-hand inspector displaying `format`, `installKind`, `scope`, `dest.user` / `dest.project`, `version`, optional `--division`, `--skills`, `--link`, `--dry-run` toggles feeding `buildInstallCommand()`, and Copy button.
- `WorkforceSection.tsx`: Accessible `type="search"` input (`aria-label="Search divisions"`), 18-division cards mapping `divisions.json` Lucide icon names via a clean `lucide-react` lookup map (falling back safely to `Sparkles`), explicit zero-match `"Reset filter"` UI, and 4 NEXUS runbook cards using `buildRunbookCommand()` with core roster slugs.
- `ContactFooter.tsx`: Contact & Email Hub displaying `hello@hivework.online` (`mailto:` + Copy button + `"Forwards to hello@itsallan.me"` note), direct `hello@itsallan.me` (`mailto:` + Copy button), `https://itsallan.me` link, and `./logo-icon.svg` MIT footer.
- `App.tsx` & `main.tsx`: Compose all sections cleanly importing `./styles/tokens.css` and `catalog.generated.json`.

- [ ] **Step 4: Run full Vitest test suite to verify pass**

Run: `cd app && npm test`
Expected: PASS (all test files and assertions passing).

- [ ] **Step 5: Commit Task 4**

```bash
git add app/src/components/ModelMatrix.tsx app/src/components/WorkforceSection.tsx app/src/components/ContactFooter.tsx app/src/App.tsx app/src/main.tsx app/src/__tests__/interactiveSections.test.tsx
git commit -m "feat(app): add ModelMatrix, WorkforceSection, ContactFooter, and App shell"
```

---

### Task 5: Namecheap Deployment Guide, Full Build & Browser Verification

**Files:**
- Create: `docs/deploy-hivework-online.md`

**Interfaces:**
- Consumes: `app/dist/` produced by `npm run build`

- [ ] **Step 1: Write `docs/deploy-hivework-online.md`**

Document:
1. Build command (`cd app && npm run build`) producing `app/dist/`.
2. Namecheap cPanel folder upload steps: upload contents of `app/dist/` into a dedicated addon-domain folder (e.g., `public_html/hivework.online/`), NOT `public_html/` root, and assign `hivework.online`'s Addon Domain Document Root to that folder.
3. Namecheap Free Email Forwarding setup: forward `hello@hivework.online` → `hello@itsallan.me`, plus the Send-As alias note for replies.
4. Post-upload verification checklist (HTTPS lock, `https://hivework.online`, `itsallan.me` link, and test email to `hello@hivework.online`).

- [ ] **Step 2: Run full production build & relative-path verification**

Run: `cd app && npm run build`
Expected: Exit `0`; `sync-catalog.mjs` syncs catalog + SVGs, `tsc --noEmit` passes, `vite build` emits `app/dist/`, and `verify-dist.mjs` confirms zero `/assets/` or `/logo` root links.

- [ ] **Step 3: Run repository CI regression checks**

Run: `./scripts/check-divisions.sh && ./scripts/check-runbooks.sh`
Expected: Both print `PASSED:` and exit `0`.

- [ ] **Step 4: Serve `app/dist/` locally and run headless browser check (`1440px` + `375px`)**

Serve `app/dist/` via `npx vite preview --port 4173` (or `python3 -m http.server 4173 -d app/dist`) and verify HTTP 200, page title, zero JS console errors, 17-tool switching, division search reset, and no horizontal overflow at `1440px` and `375px`.

- [ ] **Step 5: Commit Task 5**

```bash
git add docs/deploy-hivework-online.md
git commit -m "docs: add hivework.online Namecheap folder & email forwarding guide"
```
