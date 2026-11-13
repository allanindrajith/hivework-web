// Contract between the commands/links this site publishes and the real Hivework repo.
// Runs only when HIVEWORK_REPO_ROOT points at a checkout of github.com/allanindrajith/hivework,
// e.g. `HIVEWORK_REPO_ROOT=../Hivework npm test`. `npm run deploy` runs `npm test`, so set it there.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import rawCatalog from '../data/catalog.generated.json';
import type { CatalogData } from '../data/types';
import { buildInstallCommand } from '../lib/cliBuilder';

const catalog = rawCatalog as CatalogData;
const REPO = process.env.HIVEWORK_REPO_ROOT ? path.resolve(process.env.HIVEWORK_REPO_ROOT) : '';
const hasRepo = REPO !== '' && fs.existsSync(path.join(REPO, 'scripts/install.sh'));

function installerFlags(): Set<string> {
  const src = fs.readFileSync(path.join(REPO, 'scripts/install.sh'), 'utf8');
  const usage = src.slice(src.indexOf('USAGE-START'), src.indexOf('USAGE-END'));
  return new Set(usage.match(/--[a-z][a-z-]+/g) ?? []);
}

function componentSources(): string[] {
  const dir = path.resolve(__dirname, '../components');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
}

const missing = (relPaths: string[]) => relPaths.filter((p) => !fs.existsSync(path.join(REPO, p)));

describe.skipIf(!hasRepo)('installer contract (HIVEWORK_REPO_ROOT)', () => {
  it('every install.sh flag written in components is accepted by the installer', () => {
    const flags = installerFlags();
    const emitted = new Set<string>();
    for (const src of componentSources()) {
      for (const m of src.matchAll(/install\.sh((?:\s+--[a-z-]+(?:\s+[a-z-]+)?)+)/g)) {
        for (const f of m[1].match(/--[a-z-]+/g) ?? []) emitted.add(f);
      }
    }
    expect([...emitted].filter((f) => !flags.has(f))).toEqual([]);
  });

  it('every flag the command builder can emit is accepted by the installer', () => {
    const flags = installerFlags();
    const cmd = buildInstallCommand({
      tool: 'x',
      division: 'y',
      agents: ['z'],
      skills: true,
      link: true,
      dryRun: true,
      noInteractive: true,
    });
    expect((cmd.match(/--[a-z-]+/g) ?? []).filter((f) => !flags.has(f))).toEqual([]);
  });

  it('every catalog tool id is a valid --tool value', () => {
    const src = fs.readFileSync(path.join(REPO, 'scripts/install.sh'), 'utf8');
    const tools = new Set((src.match(/ALL_TOOLS=\(([^)]*)\)/)?.[1] ?? '').split(/\s+/).filter(Boolean));
    expect(tools.size).toBeGreaterThan(0);
    expect(catalog.tools.map((t) => t.kebab).filter((k) => !tools.has(k))).toEqual([]);
  });

  it('every agent, skill, reviewer, employee and runbook doc the site links to exists', () => {
    expect(missing(catalog.divisions.flatMap((d) => d.agents.map((a) => a.path)))).toEqual([]);
    expect(missing(catalog.skills.map((s) => s.path))).toEqual([]);
    expect(missing(catalog.reviewers.map((r) => r.path))).toEqual([]);
    expect(missing(catalog.employees.map((e) => e.path))).toEqual([]);
    expect(missing(catalog.runbooks.map((r) => r.doc))).toEqual([]);
  });

  it('every runbook agent is a division agent the installer can resolve', () => {
    const slugs = new Set(catalog.divisions.flatMap((d) => d.agents.map((a) => a.slug)));
    const unknown = catalog.runbooks.flatMap((r) => r.roster.flatMap((g) => g.agents)).filter((a) => !slugs.has(a));
    expect(unknown).toEqual([]);
  });
});
