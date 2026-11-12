import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Boxes,
  Check,
  ClipboardList,
  Code,
  Copy,
  DollarSign,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  LifeBuoy,
  Map as MapIcon,
  Megaphone,
  PenTool,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { DivisionEntry, RunbookEntry } from '../data/types';
import { buildRunbookCommand } from '../lib/cliBuilder';
import { copyText } from '../lib/clipboard';
import '../styles/sections.css';

export interface WorkforceSectionProps {
  divisions: DivisionEntry[];
  runbooks: RunbookEntry[];
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

export function WorkforceSection({ divisions, runbooks }: WorkforceSectionProps) {
  const [query, setQuery] = useState('');
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

      return division.samples.some(
        (sample) =>
          sample.name.toLowerCase().includes(trimmedQuery) ||
          sample.slug.toLowerCase().includes(trimmedQuery) ||
          sample.description.toLowerCase().includes(trimmedQuery)
      );
    });
  }, [divisions, trimmedQuery]);

  const handleCopyRunbook = async (slug: string, command: string) => {
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

  return (
    <section id="workforce" className="workforce-section" aria-labelledby="workforce-heading">
      <div className="container">
        <div className="section-header-block">
          <p className="section-eyebrow">WORKFORCE EXPLORER · {divisions.length} DIVISIONS</p>
          <h2 id="workforce-heading" className="section-heading">
            Browse specialized agent divisions and NEXUS runbooks
          </h2>
          <p className="section-lead">
            Filter all {divisions.length} functional divisions by domain or sample persona, or copy
            a pre-assembled NEXUS scenario roster command.
          </p>
        </div>

        <div className="workforce-toolbar">
          <div className="workforce-search-wrap">
            <Search size={16} className="workforce-search-icon" aria-hidden="true" />
            <input
              type="search"
              id="division-search"
              className="workforce-search-input"
              aria-label="Search divisions"
              placeholder="Filter divisions or agents (e.g. engineering, security, godot)..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <p className="workforce-count">
            Showing {filteredDivisions.length} of {divisions.length} divisions
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
          <div className="grid-responsive workforce-grid">
            {filteredDivisions.map((division) => {
              const Icon = getDivisionIcon(division.icon);
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

                  {division.samples.length > 0 ? (
                    <ul className="division-samples">
                      {division.samples.slice(0, 4).map((sample) => (
                        <li key={sample.slug} className="division-sample-item">
                          <div className="division-sample-head">
                            <span className="division-sample-name">{sample.name}</span>
                            <code className="inline-code">{sample.slug}</code>
                          </div>
                          <p className="division-sample-desc">{sample.description}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="division-card-footer">
                    <code className="inline-code">--division {division.slug}</code>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="runbooks-block">
          <div className="runbooks-header">
            <h3 className="runbooks-heading">NEXUS Scenario Runbooks</h3>
            <p className="runbooks-lead">
              Install a scenario&apos;s core always-on roster in one command using{' '}
              <code className="inline-code">--agent</code> slugs.
            </p>
          </div>

          <div className="runbooks-grid">
            {runbooks.map((runbook) => {
              const coreGroup =
                runbook.roster.find((group) => group.activation === 'always') ??
                runbook.roster[0];
              const coreAgents = coreGroup?.agents ?? [];
              const runbookCommand = buildRunbookCommand(coreAgents);
              const isCopied =
                copyFeedback?.slug === runbook.slug && copyFeedback.status === 'copied';
              const isFailed =
                copyFeedback?.slug === runbook.slug && copyFeedback.status === 'failed';

              return (
                <article key={runbook.slug} className="hairline-card runbook-card">
                  <div className="runbook-meta-row">
                    <span className="pill-badge">{runbook.mode}</span>
                    <span className="runbook-meta">
                      {runbook.duration} · {runbook.totalAgents} total ({coreAgents.length} core)
                    </span>
                  </div>

                  <h4 className="runbook-title">{runbook.title}</h4>
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
                        onClick={() => handleCopyRunbook(runbook.slug, runbookCommand)}
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
      </div>
    </section>
  );
}
