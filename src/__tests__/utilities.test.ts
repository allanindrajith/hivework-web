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
