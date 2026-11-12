import type { CliOptions } from '../data/types';

const DEFAULT_CLI_REPO_URL = 'https://github.com/allanindrajith/hivework';

/**
 * Builds the `./scripts/install.sh` (or one-line git clone bootstrap) command string.
 * Deterministic flag ordering: --tool, --division, --agent, --skills, --link, --dry-run, --no-interactive
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

  const agentList =
    opts.agents && opts.agents.length > 0
      ? Array.from(new Set(opts.agents.map((a) => a.trim()).filter(Boolean)))
      : opts.agent && opts.agent.trim().length > 0
        ? [opts.agent.trim()]
        : [];

  if (agentList.length > 0) {
    parts.push(`--agent ${agentList.join(',')}`);
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
  if (opts.noInteractive) {
    parts.push('--no-interactive');
  }

  const baseCmd = parts.join(' ');

  if (opts.mode === 'bootstrap') {
    const cleanRepo = (opts.repoUrl || DEFAULT_CLI_REPO_URL).replace(/\/+$/, '').replace(/\.git$/, '');
    return `git clone ${cleanRepo}.git && cd hivework && ${baseCmd}`;
  }

  return baseCmd;
}

/**
 * Builds an install command targeting specific runbook agents.
 * Joins non-empty unique agent slugs with commas.
 */
export function buildRunbookCommand(
  agents: string[],
  opts: { mode?: 'local' | 'bootstrap'; tool?: string; skills?: boolean } = {}
): string {
  const unique = Array.from(
    new Set(agents.filter((a) => typeof a === 'string' && a.trim().length > 0))
  );

  return buildInstallCommand({
    mode: opts.mode,
    tool: opts.tool,
    agents: unique,
    skills: opts.skills,
  });
}

/**
 * Builds a canonical GitHub blob URL for viewing a Markdown skill or agent source file.
 */
export function buildGitHubBlobUrl(repoUrl: string, relativePath: string, branch = 'main'): string {
  const base = (repoUrl || DEFAULT_CLI_REPO_URL).trim().replace(/\/+$/, '').replace(/\.git$/, '');
  const cleanRel = relativePath.replace(/^\/+/, '');
  return `${base}/blob/${branch}/${cleanRel}`;
}
