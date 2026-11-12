import type { CliOptions } from '../data/types';

/**
 * Builds the `./scripts/install.sh` command string based on selected options.
 * Deterministic flag ordering: --tool, --division, --agent, --skills, --link, --dry-run
 * Omits --tool when tool is 'all' or omitted.
 */
export function buildInstallCommand(opts: CliOptions = {}): string {
  const parts: string[] = ['./scripts/install.sh'];

  if (opts.tool && opts.tool !== 'all') {
    parts.push(`--tool ${opts.tool}`);
  }
  if (opts.division) {
    parts.push(`--division ${opts.division}`);
  }
  if (opts.agent) {
    parts.push(`--agent ${opts.agent}`);
  }
  if (opts.skills) {
    parts.push('--skills');
  }
  if (opts.link) {
    parts.push('--link');
  }
  if (opts.dryRun) {
    parts.push('--dry-run');
  }

  return parts.join(' ');
}

/**
 * Builds an install command targeting specific runbook agents.
 * Joins non-empty unique agent slugs with commas.
 */
export function buildRunbookCommand(agents: string[]): string {
  const unique = Array.from(
    new Set(agents.filter((a) => typeof a === 'string' && a.trim().length > 0))
  );

  if (unique.length === 0) {
    return './scripts/install.sh';
  }

  return `./scripts/install.sh --agent ${unique.join(',')}`;
}
