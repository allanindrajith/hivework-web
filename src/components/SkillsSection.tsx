import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Search,
  ShieldAlert,
  Sparkles,
  Terminal,
} from 'lucide-react';
import type { CliCommandMode, ReviewerEntry, SkillEntry } from '../data/types';
import { buildGitHubBlobUrl, buildInstallCommand } from '../lib/cliBuilder';
import { copyText } from '../lib/clipboard';
import { PaginationBar } from './PaginationBar';
import '../styles/sections.css';

export interface SkillsSectionProps {
  skills: SkillEntry[];
  reviewers: ReviewerEntry[];
  repoUrl?: string;
}

type SkillTab = 'all' | 'skills' | 'reviewers';

type UnifiedModule =
  | { kind: 'skill'; data: SkillEntry }
  | { kind: 'reviewer'; data: ReviewerEntry };

const PRIORITY_SKILL_SLUGS = [
  'hive-brainstorm',
  'hive-tdd-workflow',
  'hive-security-scan',
  'hive-backend-patterns',
  'hive-review-loop',
  'hive-frontend-patterns',
  'hive-analysis-optimization',
  'hive-bootstrap',
  'hive-craft-anything',
  'hive-draft',
];

const PRIORITY_REVIEWER_SLUGS = [
  'hive-design-critic',
  'hive-codebase-details',
  'hive-comprehension',
  'hive-structural',
  'hive-style',
  'hive-synthesizer',
  'hive-zoom-out',
  'hive-bootstrap-orchestrator',
  'hive-implementation-readiness',
  'hive-inventive-catalyst',
];

const MODULES_PER_PAGE = 6;

export function SkillsSection({
  skills = [],
  reviewers = [],
  repoUrl = 'https://github.com/allanindrajith/hivework',
}: SkillsSectionProps) {
  const [activeTab, setActiveTab] = useState<SkillTab>('all');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [cliMode, setCliMode] = useState<CliCommandMode>('local');
  const [copyFeedback, setCopyFeedback] = useState<{
    id: string;
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
  }, [trimmedQuery, activeTab]);

  const filteredSkills = useMemo(() => {
    if (!trimmedQuery) return skills;
    return skills.filter(
      (s) =>
        s.slug.toLowerCase().includes(trimmedQuery) ||
        s.name.toLowerCase().includes(trimmedQuery) ||
        s.description.toLowerCase().includes(trimmedQuery)
    );
  }, [skills, trimmedQuery]);

  const filteredReviewers = useMemo(() => {
    if (!trimmedQuery) return reviewers;
    return reviewers.filter(
      (r) =>
        r.slug.toLowerCase().includes(trimmedQuery) ||
        r.name.toLowerCase().includes(trimmedQuery) ||
        r.description.toLowerCase().includes(trimmedQuery)
    );
  }, [reviewers, trimmedQuery]);

  const sortedSkills = useMemo(() => {
    if (trimmedQuery) return filteredSkills;
    return [...filteredSkills].sort((a, b) => {
      const aIdx = PRIORITY_SKILL_SLUGS.indexOf(a.slug);
      const bIdx = PRIORITY_SKILL_SLUGS.indexOf(b.slug);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
  }, [filteredSkills, trimmedQuery]);

  const sortedReviewers = useMemo(() => {
    if (trimmedQuery) return filteredReviewers;
    return [...filteredReviewers].sort((a, b) => {
      const aIdx = PRIORITY_REVIEWER_SLUGS.indexOf(a.slug);
      const bIdx = PRIORITY_REVIEWER_SLUGS.indexOf(b.slug);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    });
  }, [filteredReviewers, trimmedQuery]);

  const allModules = useMemo<UnifiedModule[]>(() => {
    if (activeTab === 'skills') {
      return sortedSkills.map((s) => ({ kind: 'skill', data: s }));
    }
    if (activeTab === 'reviewers') {
      return sortedReviewers.map((r) => ({ kind: 'reviewer', data: r }));
    }

    // Tab is 'all': interleave high-priority items so top 6 contains both top skills & reviewers
    const result: UnifiedModule[] = [];
    if (!trimmedQuery) {
      // Top 6 showcase: top 4 skills and top 2 reviewers
      const topSkills = sortedSkills.slice(0, 4);
      const topReviewers = sortedReviewers.slice(0, 2);
      const remainingSkills = sortedSkills.slice(4);
      const remainingReviewers = sortedReviewers.slice(2);

      topSkills.forEach((s) => result.push({ kind: 'skill', data: s }));
      topReviewers.forEach((r) => result.push({ kind: 'reviewer', data: r }));
      remainingSkills.forEach((s) => result.push({ kind: 'skill', data: s }));
      remainingReviewers.forEach((r) => result.push({ kind: 'reviewer', data: r }));
      return result;
    }

    // When querying, combine all matching
    sortedSkills.forEach((s) => result.push({ kind: 'skill', data: s }));
    sortedReviewers.forEach((r) => result.push({ kind: 'reviewer', data: r }));
    return result;
  }, [activeTab, sortedSkills, sortedReviewers, trimmedQuery]);

  const totalPages = Math.ceil(allModules.length / MODULES_PER_PAGE) || 1;

  const paginatedModules = useMemo(() => {
    const start = (currentPage - 1) * MODULES_PER_PAGE;
    return allModules.slice(start, start + MODULES_PER_PAGE);
  }, [allModules, currentPage]);

  const installAllSkillsCommand = useMemo(
    () =>
      buildInstallCommand({
        mode: cliMode,
        repoUrl,
        skills: true,
      }),
    [cliMode, repoUrl]
  );

  const handleCopy = async (id: string, text: string) => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    const ok = await copyText(text);
    setCopyFeedback({ id, status: ok ? 'copied' : 'failed' });
    resetTimerRef.current = window.setTimeout(() => {
      setCopyFeedback(null);
      resetTimerRef.current = null;
    }, 2400);
  };

  const totalCount = skills.length + reviewers.length;
  const currentTotalInTab = allModules.length;

  return (
    <section id="skills" className="skills-section" aria-labelledby="skills-heading">
      <div className="container">
        <div className="section-header-block">
          <p className="section-eyebrow">
            SKILL &amp; REVIEWER REGISTRY · {skills.length} SKILLS · {reviewers.length} GOLDFISH REVIEWERS
          </p>
          <h2 id="skills-heading" className="section-heading">
            Connect modular SKILL.md workflows and zero-bias reviewers
          </h2>
          <p className="section-lead">
            Every skill in <code className="inline-code">skills/hive-*/SKILL.md</code> and every
            context-isolated Goldfish reviewer in <code className="inline-code">agents/hive-*.md</code>{' '}
            links directly to its GitHub Markdown source and installs via{' '}
            <code className="inline-code">./scripts/install.sh --skills</code>.
          </p>
        </div>

        <div className="hairline-card skills-cli-banner" role="region" aria-label="Skills CLI installer">
          <div className="skills-cli-banner-head">
            <div className="skills-cli-banner-info">
              <span className="pill-badge">
                <Terminal size={12} aria-hidden="true" />
                <span>CLI Skill Sync</span>
              </span>
              <span className="skills-cli-banner-text">
                Supported harnesses: Claude Code (<code className="inline-code">~/.claude/skills</code>),
                Antigravity (<code className="inline-code">~/.gemini/config/skills</code>), Codex (
                <code className="inline-code">~/.codex/skills</code>), Osaurus, and DSH.
              </span>
            </div>

            <div className="terminal-mode-switch" role="group" aria-label="Skills CLI mode">
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

          <div className="skills-cli-banner-row">
            <pre className="terminal-code-wrap skills-code-wrap">
              <span className="terminal-prompt" aria-hidden="true">
                &gt;
              </span>
              <code className="terminal-command">{installAllSkillsCommand}</code>
            </pre>

            <div className="skills-cli-banner-actions">
              <button
                type="button"
                className="terminal-copy-btn"
                onClick={() => handleCopy('all-skills', installAllSkillsCommand)}
                aria-label="Copy skills install command"
              >
                {copyFeedback?.id === 'all-skills' && copyFeedback.status === 'copied' ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
                <span>
                  {copyFeedback?.id === 'all-skills' && copyFeedback.status === 'copied'
                    ? 'Copied'
                    : 'Copy --skills command'}
                </span>
              </button>

              <a
                href={`${repoUrl.replace(/\/+$/, '')}/tree/main/skills`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline skills-repo-btn"
              >
                <span>Browse skills/ on GitHub</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        <div className="workforce-toolbar skills-toolbar">
          <div className="matrix-filters skills-filter-tabs" role="group" aria-label="Filter skills and reviewers">
            <button
              type="button"
              className="matrix-filter-btn"
              aria-pressed={activeTab === 'all'}
              onClick={() => setActiveTab('all')}
            >
              All ({totalCount})
            </button>
            <button
              type="button"
              className="matrix-filter-btn"
              aria-pressed={activeTab === 'skills'}
              onClick={() => setActiveTab('skills')}
            >
              Modular Skills ({skills.length})
            </button>
            <button
              type="button"
              className="matrix-filter-btn"
              aria-pressed={activeTab === 'reviewers'}
              onClick={() => setActiveTab('reviewers')}
            >
              Goldfish Reviewers ({reviewers.length})
            </button>
          </div>

          <div className="workforce-search-wrap">
            <Search size={16} className="workforce-search-icon" aria-hidden="true" />
            <input
              type="search"
              id="skills-search"
              className="workforce-search-input"
              aria-label="Search skills and reviewers"
              placeholder="Filter skills or reviewers (e.g. brainstorm, tdd, security, critic)..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <p className="workforce-count skills-count-line">
          Showing {currentTotalInTab} of {totalCount} modules · Page {currentPage} of {totalPages}
        </p>

        {allModules.length === 0 ? (
          <div className="hairline-card workforce-empty">
            <p className="workforce-empty-title">
              No modules match &ldquo;{query.trim()}&rdquo;.
            </p>
            <button type="button" className="btn-outline" onClick={() => setQuery('')}>
              Reset filter
            </button>
          </div>
        ) : (
          <>
            <div className="grid-responsive skills-grid">
              {paginatedModules.map((mod) => {
                if (mod.kind === 'skill') {
                  const skill = mod.data;
                  const githubBlobUrl = buildGitHubBlobUrl(repoUrl, skill.path);
                  const skillCliCmd = buildInstallCommand({
                    mode: cliMode,
                    repoUrl,
                    skills: true,
                  });
                  const isCopied =
                    copyFeedback?.id === skill.slug && copyFeedback.status === 'copied';

                  return (
                    <article key={skill.slug} className="hairline-card skill-card">
                      <div className="skill-card-header">
                        <div className="skill-card-title-row">
                          <Sparkles size={16} className="division-icon" aria-hidden="true" />
                          <h3 className="skill-card-title">{skill.slug}</h3>
                        </div>
                        <span className="pill-badge">SKILL.md</span>
                      </div>

                      <p className="skill-card-desc">{skill.description}</p>

                      <div className="skill-card-footer">
                        <code className="inline-code">{skill.path}</code>
                        <div className="skill-card-actions">
                          <button
                            type="button"
                            className="terminal-copy-btn skill-mini-btn"
                            onClick={() => handleCopy(skill.slug, skillCliCmd)}
                            aria-label={`Copy CLI command for ${skill.slug}`}
                          >
                            {isCopied ? (
                              <Check size={12} aria-hidden="true" />
                            ) : (
                              <Copy size={12} aria-hidden="true" />
                            )}
                            <span>{isCopied ? 'Copied' : '--skills'}</span>
                          </button>

                          <a
                            href={githubBlobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="skill-github-link"
                            aria-label={`Open ${skill.slug} SKILL.md on GitHub`}
                          >
                            <BookOpen size={12} aria-hidden="true" />
                            <span>SKILL.md</span>
                            <ExternalLink size={12} aria-hidden="true" />
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                }

                const reviewer = mod.data;
                const githubBlobUrl = buildGitHubBlobUrl(repoUrl, reviewer.path);
                // No CLI copy here: install.sh --agent only resolves division agents, not agents/ reviewers.
                return (
                  <article key={reviewer.slug} className="hairline-card skill-card reviewer-card">
                    <div className="skill-card-header">
                      <div className="skill-card-title-row">
                        <ShieldAlert size={16} className="division-icon" aria-hidden="true" />
                        <h3 className="skill-card-title">{reviewer.slug}</h3>
                      </div>
                      <span className="pill-badge pill-badge-warning">Goldfish</span>
                    </div>

                    <p className="skill-card-desc">{reviewer.description}</p>

                    <div className="skill-card-footer">
                      <code className="inline-code">{reviewer.path}</code>
                      <div className="skill-card-actions">
                        <a
                          href={githubBlobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="skill-github-link"
                          aria-label={`Open ${reviewer.slug} on GitHub`}
                        >
                          <BookOpen size={12} aria-hidden="true" />
                          <span>Reviewer .md</span>
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={currentTotalInTab}
              itemsPerPage={MODULES_PER_PAGE}
              itemLabel="modules"
              onPageChange={setCurrentPage}
              sectionId="skills"
            />
          </>
        )}
      </div>
    </section>
  );
}
