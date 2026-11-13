import type { CliOptions } from '../data/types';

const DEFAULT_CLI_REPO_URL = 'https://github.com/allanindrajith/hivework';

// Catalog slugs are kebab-case. Anything else is dropped so a pasted command can never carry shell syntax.
const SAFE_SLUG = /^[a-z0-9][a-z0-9-]*$/;

function safeSlug(value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return SAFE_SLUG.test(trimmed) ? trimmed : null;
}

function normalizeRepoUrl(repoUrl?: string): string {
  return (repoUrl || DEFAULT_CLI_REPO_URL).trim().replace(/\/+$/, '').replace(/\.git$/, '');
}

/**
 * Wraps a repo-relative script command (e.g. `./scripts/convert.sh --parallel`) in a one-liner that
 * clones the repo to ~/<name> (or fast-forwards an existing clone) and runs the script by path.
 * Running by path keeps the caller's working directory, so project-scoped tools (Cursor, OpenCode,
 * Qwen, Aider, Windsurf) install into the user's project, and the command is safe to re-run.
 */
export function buildBootstrapCommand(scriptCommand: string, repoUrl?: string): string {
  const cleanRepo = normalizeRepoUrl(repoUrl);
  const repoName = cleanRepo.split('/').filter(Boolean).pop() || 'hivework';
  const cloneDir = `~/${repoName}`;
  const script = scriptCommand.replace(/^\.\//, `${cloneDir}/`);
  return `([ -d ${cloneDir} ] && git -C ${cloneDir} pull --ff-only || git clone ${cleanRepo}.git ${cloneDir}) && ${script}`;
}

/**
 * Builds the `./scripts/install.sh` (or one-line bootstrap) command string.
 * Deterministic flag ordering: --tool, --division, --agent, --skills, --link, --dry-run, --no-interactive
 * Omits --tool when tool is 'all' or omitted. Drops any value that is not a plain kebab-case slug.
 */
export function buildInstallCommand(opts: CliOptions = {}): string {
  const parts: string[] = ['./scripts/install.sh'];

  const tool = safeSlug(opts.tool);
  if (tool && tool !== 'all') {
    parts.push(`--tool ${tool}`);
  }
  const division = safeSlug(opts.division);
  if (division) {
    parts.push(`--division ${division}`);
  }

  const rawAgents = opts.agents && opts.agents.length > 0 ? opts.agents : [opts.agent ?? ''];
  const agentList = Array.from(
    new Set(rawAgents.map(safeSlug).filter((slug): slug is string => slug !== null))
  );

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
    return buildBootstrapCommand(baseCmd, opts.repoUrl);
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
  const base = normalizeRepoUrl(repoUrl);
  const cleanRel = relativePath.replace(/^\/+/, '');
  return `${base}/blob/${branch}/${cleanRel}`;
}
