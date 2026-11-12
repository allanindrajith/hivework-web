import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import catalogData from '../data/catalog.generated.json';
import { buildCatalog, syncCatalog } from '../../scripts/sync-catalog.mjs';
import { verifyDistHtml } from '../../scripts/verify-dist.mjs';

function createFixtureRepo(rootDir: string) {
  fs.mkdirSync(path.join(rootDir, 'engineering'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'strategy'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'skills/hive-brainstorm'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'agents'), { recursive: true });
  fs.mkdirSync(path.join(rootDir, 'assets'), { recursive: true });

  fs.writeFileSync(
    path.join(rootDir, 'tools.json'),
    JSON.stringify({
      tools: {
        claudeCode: {
          id: 'claudeCode',
          label: 'Claude Code',
          short: 'Claude',
          kebab: 'claude-code',
          accent: '#D97757',
          icon: 'claudecode',
          order: 1,
          scope: { user: true, project: true },
          detect: { dirs: ['.claude'], agentsDir: '.claude/agents' },
          version: { bin: 'claude', args: ['--version'] },
          format: 'markdown-frontmatter',
          installKind: 'per-agent',
          dest: { user: ['.claude/agents'], project: ['.claude/agents'] },
        },
      },
    }),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, 'divisions.json'),
    JSON.stringify({
      divisions: {
        engineering: {
          label: 'Engineering',
          icon: 'code',
          color: '#3B82F6',
        },
      },
    }),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, 'strategy/runbooks.json'),
    JSON.stringify({
      runbooks: [
        {
          slug: 'launch',
          title: 'Launch',
          mode: 'parallel',
          duration: '1h',
          summary: 'Launch test',
          doc: 'docs/launch.md',
          roster: [{ group: 'Core', activation: 'always', agents: ['alpha-agent'] }],
        },
      ],
    }),
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, 'engineering/alpha-agent.md'),
    '---\nname: Alpha Agent\ndescription: First test agent\n---\nBody\n',
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, 'skills/hive-brainstorm/SKILL.md'),
    '---\nname: hive-brainstorm\ndescription: >-\n  Interactive brainstorming skill\n  for structured RFCs.\n---\nSkill Body\n',
    'utf8'
  );

  fs.writeFileSync(
    path.join(rootDir, 'agents/hive-design-critic.md'),
    '---\nname: hive-design-critic\ndescription: Hostile design critic persona.\n---\nReviewer Body\n',
    'utf8'
  );

  fs.mkdirSync(path.join(rootDir, 'employees/chief-of-staff/routines/standup'), { recursive: true });
  fs.writeFileSync(
    path.join(rootDir, 'employees/chief-of-staff/employee.json'),
    JSON.stringify({
      slug: 'chief-of-staff',
      name: 'Chief of Staff',
      role: 'Oversight and strategy',
      version: '1.9.0',
      license: 'MIT',
      repository: 'https://github.com/allanindrajith/hivework',
    }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(rootDir, 'employees/chief-of-staff/work-profile.json'),
    JSON.stringify({
      objective: 'Observed delivery and decisions that improve the business',
      standup: 'standup',
      reviewer: 'review',
      routines: { standup: {} },
    }),
    'utf8'
  );

  fs.writeFileSync(path.join(rootDir, 'assets/logo.svg'), '<svg></svg>', 'utf8');
  fs.writeFileSync(path.join(rootDir, 'assets/logo-icon.svg'), '<svg></svg>', 'utf8');
}

describe('sync-catalog', () => {
  it('contains exact verified extracted catalog totals sorted cleanly', () => {
    expect(catalogData.totals).toEqual({
      agents: 345,
      divisions: 18,
      tools: 17,
      skills: 25,
      reviewers: 10,
      runbooks: 4,
      employees: 8,
    });
    expect(catalogData.tools.map((t) => t.order)).toEqual(
      Array.from({ length: 17 }, (_, i) => i + 1)
    );
    expect(catalogData.divisions[0]).toHaveProperty('samples');
    expect(catalogData.divisions[0]).toHaveProperty('agents');
    expect(catalogData.divisions[0].agents.length).toBe(catalogData.divisions[0].agentCount);
    expect(catalogData.divisions[0].agents[0]).toHaveProperty('path');
    expect(catalogData.skills).toHaveLength(25);
    expect(catalogData.skills[0]).toMatchObject({
      slug: expect.stringMatching(/^hive-/),
      path: expect.stringMatching(/^skills\/hive-.*\/SKILL\.md$/),
    });
    expect(catalogData.skills[0].description).not.toMatch(/^>-/);
    expect(catalogData.reviewers).toHaveLength(10);
    expect(catalogData.reviewers[0]).toMatchObject({
      slug: expect.stringMatching(/^hive-/),
      path: expect.stringMatching(/^agents\/hive-.*\.md$/),
    });
    expect(catalogData.employees).toHaveLength(8);
    expect(catalogData.employees[0]).toMatchObject({
      slug: expect.any(String),
      name: expect.any(String),
      role: expect.any(String),
      routineCount: expect.any(Number),
      routines: expect.any(Array),
      path: expect.stringMatching(/^employees\//),
    });
  });

  it('throws descriptive error when tools.json or divisions.json is missing', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hivework-missing-'));
    try {
      expect(() => buildCatalog(tmpDir)).toThrow(/tools\.json/);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('preserves generatedAt and skips rewriting when payload is unchanged, and updates when payload changes', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hivework-sync-'));
    try {
      createFixtureRepo(tmpDir);

      const first = syncCatalog(tmpDir);
      const targetJsonPath = path.join(tmpDir, 'app/src/data/catalog.generated.json');
      expect(fs.existsSync(targetJsonPath)).toBe(true);
      expect(first.totals.agents).toBe(1);

      const sentinelTimestamp = '2025-01-01T00:00:00.000Z';
      const pinned = { ...first, generatedAt: sentinelTimestamp };
      fs.writeFileSync(targetJsonPath, JSON.stringify(pinned, null, 2) + '\n', 'utf8');
      const pastDate = new Date(sentinelTimestamp);
      fs.utimesSync(targetJsonPath, pastDate, pastDate);

      const second = syncCatalog(tmpDir);
      expect(second.generatedAt).toBe(sentinelTimestamp);
      expect(fs.statSync(targetJsonPath).mtimeMs).toBe(pastDate.getTime());
      expect(JSON.parse(fs.readFileSync(targetJsonPath, 'utf8')).generatedAt).toBe(sentinelTimestamp);

      fs.writeFileSync(
        path.join(tmpDir, 'engineering/beta-agent.md'),
        '---\nname: Beta Agent\ndescription: Second test agent\n---\nBody\n',
        'utf8'
      );

      const third = syncCatalog(tmpDir);
      expect(third.totals.agents).toBe(2);
      expect(third.generatedAt).not.toBe(sentinelTimestamp);
      expect(JSON.parse(fs.readFileSync(targetJsonPath, 'utf8')).totals.agents).toBe(2);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
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
