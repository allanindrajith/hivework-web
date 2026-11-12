import { afterEach, describe, expect, it, vi } from 'vitest';
import { siteConfig } from '../data/site';
import {
  buildGitHubBlobUrl,
  buildInstallCommand,
  buildRunbookCommand,
} from '../lib/cliBuilder';
import { getSectionPath, resolveSectionFromPath } from '../lib/navigation';
import { copyText } from '../lib/clipboard';

describe('siteConfig', () => {
  it('pins canonical domain, creator site, GitHub repositories, and forwarding email addresses', () => {
    expect(siteConfig.domain).toBe('hivework.online');
    expect(siteConfig.creatorUrl).toBe('https://itsallan.me');
    expect(siteConfig.primaryEmail).toBe('hello@hivework.online');
    expect(siteConfig.forwardTargetEmail).toBe('hello@itsallan.me');
    expect(siteConfig.repoUrl).toBe('https://github.com/allanindrajith/hivework');
    expect(siteConfig.githubUrl).toBe('https://github.com/allanindrajith/hivework-web');
  });
});

describe('cliBuilder', () => {
  it('builds install.sh commands matching real tool, division, agents, skills, link, and dry-run flags', () => {
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

  it('supports bootstrap one-liner mode and multi-agent selection for real users and agents', () => {
    expect(
      buildInstallCommand({
        mode: 'bootstrap',
        tool: 'claude-code',
        agents: ['hive-ai-engineer', 'hive-backend-architect'],
        skills: true,
        noInteractive: true,
      })
    ).toBe(
      'git clone https://github.com/allanindrajith/hivework.git && cd hivework && ./scripts/install.sh --tool claude-code --agent hive-ai-engineer,hive-backend-architect --skills --no-interactive'
    );
  });

  it('builds GitHub blob deep links for skills and agent markdown files', () => {
    expect(
      buildGitHubBlobUrl(
        'https://github.com/allanindrajith/hivework',
        'skills/hive-brainstorm/SKILL.md'
      )
    ).toBe('https://github.com/allanindrajith/hivework/blob/main/skills/hive-brainstorm/SKILL.md');
  });

  it('builds runbook command using comma-separated --agent slugs', () => {
    expect(buildRunbookCommand(['hive-agents-orchestrator', 'hive-frontend-developer'])).toBe(
      './scripts/install.sh --agent hive-agents-orchestrator,hive-frontend-developer'
    );
  });
});

describe('navigation clean URLs', () => {
  it('maps clean paths without # hashes to section IDs and back', () => {
    expect(getSectionPath('hero')).toBe('/');
    expect(getSectionPath('model-matrix')).toBe('/harnesses');
    expect(getSectionPath('workforce')).toBe('/agents');
    expect(getSectionPath('skills')).toBe('/skills');
    expect(getSectionPath('runbooks')).toBe('/runbooks');
    expect(getSectionPath('story')).toBe('/architecture');
    expect(getSectionPath('contact')).toBe('/contact');

    expect(resolveSectionFromPath('/')).toBe('hero');
    expect(resolveSectionFromPath('/harnesses')).toBe('model-matrix');
    expect(resolveSectionFromPath('/agents')).toBe('workforce');
    expect(resolveSectionFromPath('/skills')).toBe('skills');
    expect(resolveSectionFromPath('/runbooks')).toBe('runbooks');
    expect(resolveSectionFromPath('/architecture')).toBe('story');
    expect(resolveSectionFromPath('/contact')).toBe('contact');
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

  it('removes temporary textarea in finally even when execCommand throws', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
    });
    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error('execCommand crashed');
    });
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    expect(await copyText('hello@itsallan.me')).toBe(false);
    expect(removeChildSpy).toHaveBeenCalledTimes(1);
    expect(document.body.querySelectorAll('textarea')).toHaveLength(0);
  });
});
