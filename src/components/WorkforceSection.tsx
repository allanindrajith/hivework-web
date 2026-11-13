import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Boxes,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Code,
  Copy,
  DollarSign,
  ExternalLink,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  LifeBuoy,
  Map as MapIcon,
  Megaphone,
  PenTool,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Terminal,
  TrendingUp,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { CliCommandMode, DivisionEntry, RunbookEntry } from '../data/types';
import {
  buildGitHubBlobUrl,
  buildInstallCommand,
  buildRunbookCommand,
} from '../lib/cliBuilder';
import { copyText } from '../lib/clipboard';
import { PaginationBar } from './PaginationBar';
import '../styles/sections.css';

export interface WorkforceSectionProps {
  divisions: DivisionEntry[];
  runbooks?: RunbookEntry[];
  repoUrl?: string;
  includeRunbooks?: boolean;
}

const DIVISION_ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  PenTool,
  Code,
  DollarSign,
  Gamepad2,
  Map: MapIcon,
  Stethoscope,
  Megaphone,
  Target,
  Box,
  ClipboardList,
  Search,
  TrendingUp,
  ShieldCheck,
  Boxes,
  Sparkles,
  LifeBuoy,
  FlaskConical,
};

function getDivisionIcon(iconName: string): LucideIcon {
  return DIVISION_ICON_MAP[iconName] ?? Sparkles;
}

const PRIORITY_DIVISION_SLUGS = [
  'engineering',
  'game-development',
  'security',
  'design',
  'marketing',
  'product',
  'specialized',
  'sales',
  'testing',
  'gis',
  'project-management',
  'paid-media',
  'finance',
  'spatial-computing',
  'support',
  'academic',
  'healthcare',
  'research',
];

const DIVISIONS_PER_PAGE = 6;

export function WorkforceSection({
  divisions,
  runbooks = [],
  repoUrl = 'https://github.com/allanindrajith/hivework',
  includeRunbooks = true,
}: WorkforceSectionProps) {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedDivisions, setExpandedDivisions] = useState<Record<string, boolean>>({});
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [includeSkillsInCart, setIncludeSkillsInCart] = useState(true);
  const [cliMode, setCliMode] = useState<CliCommandMode>('local');
  const [copyFeedback, setCopyFeedback] = useState<{
    slug: string;
    status: 'copied' | 'failed';
  } | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const trimmedQuery = query.trim().toLowerCase();

  useEffect(() => {
    setCurrentPage(1);
  }, [trimmedQuery]);

  const filteredDivisions = useMemo(() => {
    if (!trimmedQuery) {
      return divisions;
    }

    return divisions.filter((division) => {
      if (
        division.label.toLowerCase().includes(trimmedQuery) ||
        division.slug.toLowerCase().includes(trimmedQuery)
      ) {
        return true;
      }

      const pool = division.agents ?? division.samples;
      return pool.some(
        (agent) =>
          agent.name.toLowerCase().includes(trimmedQuery) ||
          agent.slug.toLowerCase().includes(trimmedQuery) ||
          agent.description.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [divisions, trimmedQuery]);

  const sortedDivisions = useMemo(() => {
    if (trimmedQuery) {
      return filteredDivisions;
    }
    return [...filteredDivisions].sort((a, b) => {
      const aIdx = PRIORITY_DIVISION_SLUGS.indexOf(a.slug);
      const bIdx = PRIORITY_DIVISION_SLUGS.indexOf(b.slug);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
  }, [filteredDivisions, trimmedQuery]);

  const totalPages = Math.ceil(sortedDivisions.length / DIVISIONS_PER_PAGE) || 1;

  const paginatedDivisions = useMemo(() => {
    const start = (currentPage - 1) * DIVISIONS_PER_PAGE;
    return sortedDivisions.slice(start, start + DIVISIONS_PER_PAGE);
  }, [sortedDivisions, currentPage]);

  const customAgentCommand = useMemo(
    () =>
      buildInstallCommand({
        mode: cliMode,
        repoUrl,
        agents: selectedAgents,
        skills: includeSkillsInCart,
      }),
    [cliMode, repoUrl, selectedAgents, includeSkillsInCart]
  );

  const toggleSelectAgent = (slug: string) => {
    setSelectedAgents((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  };

  const toggleExpandDivision = (divisionId: string) => {
    setExpandedDivisions((prev) => ({
      ...prev,
      [divisionId]: !prev[divisionId],
    }));
  };

  const handleCopyCommand = async (slug: string, command: string) => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const ok = await copyText(command);
    setCopyFeedback({ slug, status: ok ? 'copied' : 'failed' });

    resetTimerRef.current = window.setTimeout(() => {
      setCopyFeedback(null);
      resetTimerRef.current = null;
    }, 2400);
  };

  const handleCopyRunbookCompat = async (slug: string, command: string) => {
    await handleCopyCommand(slug, command);
  };

  return (
    <section id="workforce" className="workforce-section" aria-labelledby="workforce-heading">
      <div className="container">
        <div className="section-header-block">
          <p className="section-eyebrow">WORKFORCE EXPLORER · {divisions.length} DIVISIONS</p>
          <h2 id="workforce-heading" className="section-heading">
            Browse specialized agent divisions, build custom CLI rosters, and link to GitHub
          </h2>
          <p className="section-lead">
            Filter all {divisions.length} functional divisions, select individual agents to assemble
            a custom <code className="inline-code">./scripts/install.sh --agent</code> command, or
            inspect each persona&apos;s raw Markdown on GitHub.
          </p>
        </div>

        {selectedAgents.length > 0 ? (
          <div
            className="hairline-card custom-cart-bar"
            role="region"
            aria-label="Selected agent CLI builder"
          >
            <div className="custom-cart-header">
              <div className="custom-cart-title-row">
                <span className="pill-badge">
                  <Terminal size={12} aria-hidden="true" />
                  <span>{selectedAgents.length} Selected for CLI</span>
                </span>
                <label className="matrix-flag-toggle">
                  <input
                    type="checkbox"
                    checked={includeSkillsInCart}
                    onChange={(e) => setIncludeSkillsInCart(e.target.checked)}
                  />
                  <code>--skills</code>
                </label>
                <div className="terminal-mode-switch" role="group" aria-label="Cart CLI mode">
                  <button
                    type="button"
                    className="terminal-mode-btn"
                    aria-pressed={cliMode === 'local'}
                    onClick={() => setCliMode('local')}
                  >
                    Local CLI
                  </button>
                  <button
                    type="button"
                    className="terminal-mode-btn"
                    aria-pressed={cliMode === 'bootstrap'}
                    onClick={() => setCliMode('bootstrap')}
                  >
                    Git Clone + Run
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="terminal-copy-btn"
                onClick={() => setSelectedAgents([])}
                aria-label="Clear selected agents"
              >
                <X size={12} aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>

            <div className="runbook-roster-chips custom-cart-chips">
              {selectedAgents.map((slug) => (
                <button
                  key={slug}
                  type="button"
                  className="cart-agent-chip"
                  onClick={() => toggleSelectAgent(slug)}
                  aria-label={`Remove ${slug}`}
                >
                  <code>{slug}</code>
                  <X size={11} aria-hidden="true" />
                </button>
              ))}
            </div>

            <div className="skills-cli-banner-row">
              <pre className="terminal-code-wrap skills-code-wrap">
                <span className="terminal-prompt" aria-hidden="true">
                  &gt;
                </span>
                <code className="terminal-command">{customAgentCommand}</code>
              </pre>

              <button
                type="button"
                className="terminal-copy-btn"
                onClick={() => handleCopyCommand('custom-cart', customAgentCommand)}
                aria-label="Copy selected agents command"
              >
                {copyFeedback?.slug === 'custom-cart' && copyFeedback.status === 'copied' ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
                <span>
                  {copyFeedback?.slug === 'custom-cart' && copyFeedback.status === 'copied'
                    ? 'Copied'
                    : 'Copy CLI command'}
                </span>
              </button>
            </div>
          </div>
        ) : null}

        <div className="workforce-toolbar">
          <div className="workforce-search-wrap">
            <Search size={16} className="workforce-search-icon" aria-hidden="true" />
            <input
              type="search"
              id="division-search"
              className="workforce-search-input"
              aria-label="Search divisions"
              placeholder="Filter divisions or 345 agents (e.g. engineering, security, godot, architect)..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <p className="workforce-count">
            Showing {filteredDivisions.length} of {divisions.length} divisions · Page {currentPage} of {totalPages}
          </p>
        </div>

        {filteredDivisions.length === 0 ? (
          <div className="hairline-card workforce-empty">
            <p className="workforce-empty-title">
              No divisions match &ldquo;{query.trim()}&rdquo;.
            </p>
            <p className="workforce-empty-body">
              Clear the search query to inspect all {divisions.length} workforce divisions and their
              sample agents.
            </p>
            <button type="button" className="btn-outline" onClick={() => setQuery('')}>
              Reset filter
            </button>
          </div>
        ) : (
          <>
            <div className="grid-responsive workforce-grid">
              {paginatedDivisions.map((division) => {
                const Icon = getDivisionIcon(division.icon);
                const allAgents = division.agents ?? division.samples.map((s) => ({
                  ...s,
                  path: `${division.slug}/${s.slug}.md`,
                }));

                const matchingAgents = trimmedQuery
                  ? allAgents.filter(
                      (a) =>
                        a.name.toLowerCase().includes(trimmedQuery) ||
                        a.slug.toLowerCase().includes(trimmedQuery) ||
                        a.description.toLowerCase().includes(trimmedQuery)
                    )
                  : allAgents;

                const agentsToDisplay =
                  matchingAgents.length > 0 ? matchingAgents : allAgents;
                const isExpanded = Boolean(expandedDivisions[division.id] || trimmedQuery);
                const visibleAgents = isExpanded
                  ? agentsToDisplay
                  : agentsToDisplay.slice(0, 4);

                const divisionCliCmd = buildInstallCommand({
                  mode: cliMode,
                  repoUrl,
                  division: division.slug,
                });
                const isDivCopied =
                  copyFeedback?.slug === `div-${division.slug}` &&
                  copyFeedback.status === 'copied';

                return (
                  <article key={division.id} className="hairline-card division-card">
                    <div className="division-card-header">
                      <div className="division-card-title-row">
                        <span
                          className="status-dot"
                          style={{ backgroundColor: division.color }}
                          aria-hidden="true"
                        />
                        <Icon size={18} className="division-icon" aria-hidden="true" />
                        <h3 className="division-title">{division.label}</h3>
                      </div>

                      <span className="pill-badge">
                        {division.agentCount} {division.agentCount === 1 ? 'agent' : 'agents'}
                      </span>
                    </div>

                    {visibleAgents.length > 0 ? (
                      <ul className="division-samples">
                        {visibleAgents.map((agent) => {
                          const isSelected = selectedAgents.includes(agent.slug);
                          const agentGithubUrl = buildGitHubBlobUrl(
                            repoUrl,
                            agent.path || `${division.slug}/${agent.slug}.md`
                          );
                          return (
                            <li key={agent.slug} className="division-sample-item">
                              <div className="division-sample-head">
                                <span className="division-sample-name">{agent.name}</span>
                                <div className="division-agent-actions">
                                  <button
                                    type="button"
                                    className={
                                      isSelected
                                        ? 'agent-select-btn agent-select-btn-active'
                                        : 'agent-select-btn'
                                    }
                                    aria-pressed={isSelected}
                                    aria-label={`Select agent ${agent.slug}`}
                                    onClick={() => toggleSelectAgent(agent.slug)}
                                  >
                                    {isSelected ? (
                                      <>
                                        <Check size={11} aria-hidden="true" />
                                        <span>Selected</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus size={11} aria-hidden="true" />
                                        <span>+ CLI</span>
                                      </>
                                    )}
                                  </button>
                                  <a
                                    href={agentGithubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="agent-github-link"
                                    aria-label={`View ${agent.slug} on GitHub`}
                                    title={`Open ${agent.slug}.md on GitHub`}
                                  >
                                    <code>{agent.slug}</code>
                                    <ExternalLink size={11} aria-hidden="true" />
                                  </a>
                                </div>
                              </div>
                              <p className="division-sample-desc">{agent.description}</p>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}

                    <div className="division-card-footer">
                      <button
                        type="button"
                        className="terminal-copy-btn skill-mini-btn"
                        onClick={() =>
                          handleCopyCommand(`div-${division.slug}`, divisionCliCmd)
                        }
                        aria-label={`Copy division ${division.slug} CLI command`}
                      >
                        {isDivCopied ? (
                          <Check size={12} aria-hidden="true" />
                        ) : (
                          <Copy size={12} aria-hidden="true" />
                        )}
                        <span>
                          {isDivCopied ? 'Copied' : `--division ${division.slug}`}
                        </span>
                      </button>

                      {agentsToDisplay.length > 4 && !trimmedQuery ? (
                        <button
                          type="button"
                          className="division-expand-btn"
                          onClick={() => toggleExpandDivision(division.id)}
                        >
                          {isExpanded ? (
                            <>
                              <span>Show top 4</span>
                              <ChevronUp size={13} aria-hidden="true" />
                            </>
                          ) : (
                            <>
                              <span>Show all {agentsToDisplay.length}</span>
                              <ChevronDown size={13} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      ) : (
                        <a
                          href={`${repoUrl.replace(/\/+$/, '')}/tree/main/${division.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="skill-github-link"
                          aria-label={`Browse ${division.slug}/ on GitHub`}
                        >
                          <span>Explore folder</span>
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedDivisions.length}
              itemsPerPage={DIVISIONS_PER_PAGE}
              itemLabel="divisions"
              onPageChange={setCurrentPage}
              sectionId="workforce"
            />
          </>
        )}

        {includeRunbooks && runbooks.length > 0 ? (
          <div id="runbooks" className="runbooks-block">
            <div className="runbooks-header">
              <h3 className="runbooks-heading">NEXUS Scenario Runbooks</h3>
              <p className="runbooks-lead">
                Install a scenario&apos;s core always-on roster in one command using{' '}
                <code className="inline-code">--agent</code> slugs, or open the full playbook on
                GitHub.
              </p>
            </div>

            <div className="runbooks-grid">
              {runbooks.map((runbook) => {
                const coreGroup =
                  runbook.roster.find((group) => group.activation === 'always') ??
                  runbook.roster[0];
                const coreAgents = coreGroup?.agents ?? [];
                const runbookCommand = buildRunbookCommand(coreAgents, { mode: cliMode });
                const isCopied =
                  copyFeedback?.slug === runbook.slug && copyFeedback.status === 'copied';
                const isFailed =
                  copyFeedback?.slug === runbook.slug && copyFeedback.status === 'failed';
                const runbookDocUrl = buildGitHubBlobUrl(repoUrl, runbook.doc);

                return (
                  <article key={runbook.slug} className="hairline-card runbook-card">
                    <div className="runbook-meta-row">
                      <span className="pill-badge">{runbook.mode}</span>
                      <span className="runbook-meta">
                        {runbook.duration} · {runbook.totalAgents} total ({coreAgents.length} core)
                      </span>
                    </div>

                    <div className="runbook-title-row">
                      <h4 className="runbook-title">{runbook.title}</h4>
                      <a
                        href={runbookDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="skill-github-link"
                        aria-label={`View ${runbook.title} playbook on GitHub`}
                      >
                        <span>Playbook .md</span>
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </div>

                    <p className="runbook-summary">{runbook.summary}</p>

                    <div className="runbook-roster-box">
                      <span className="runbook-roster-label">
                        {coreGroup?.group ?? 'Core Team'} ({coreAgents.length} slugs)
                      </span>
                      <div className="runbook-roster-chips">
                        {coreAgents.map((agentSlug) => (
                          <code key={agentSlug} className="inline-code">
                            {agentSlug}
                          </code>
                        ))}
                      </div>
                    </div>

                    <div className="terminal-window runbook-terminal">
                      <pre className="terminal-code-wrap">
                        <span className="terminal-prompt" aria-hidden="true">
                          &gt;
                        </span>
                        <code className="terminal-command">{runbookCommand}</code>
                      </pre>

                      <div className="terminal-footer">
                        <button
                          type="button"
                          className="terminal-copy-btn"
                          onClick={() => handleCopyRunbookCompat(runbook.slug, runbookCommand)}
                          aria-label={`Copy ${runbook.title} command`}
                        >
                          {isCopied ? (
                            <Check size={14} aria-hidden="true" />
                          ) : (
                            <Copy size={14} aria-hidden="true" />
                          )}
                          <span>Copy runbook</span>
                        </button>

                        <span className="terminal-copy-status" role="status" aria-live="polite">
                          {isCopied
                            ? 'Copied'
                            : isFailed
                              ? 'Copy failed — select manually'
                              : ''}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
