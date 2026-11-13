import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Terminal } from 'lucide-react';
import type { CliCommandMode, RunbookEntry } from '../data/types';
import { buildGitHubBlobUrl, buildRunbookCommand } from '../lib/cliBuilder';
import { copyText } from '../lib/clipboard';
import '../styles/sections.css';

export interface RunbooksSectionProps {
  runbooks: RunbookEntry[];
  repoUrl?: string;
}

export function RunbooksSection({
  runbooks = [],
  repoUrl = 'https://github.com/allanindrajith/hivework',
}: RunbooksSectionProps) {
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
    <section id="runbooks" className="workforce-section runbooks-standalone-section" aria-labelledby="runbooks-heading">
      <div className="container">
        <div className="runbooks-block">
          <div className="runbooks-header">
            <div className="runbooks-header-left">
              <span className="pill-badge">
                <Terminal size={12} aria-hidden="true" />
                <span>NEXUS Playbooks · {runbooks.length} Scenarios</span>
              </span>
              <h3 id="runbooks-heading" className="runbooks-heading">NEXUS Scenario Runbooks</h3>
              <p className="runbooks-lead">
                Install a scenario&apos;s core always-on roster in one command using{' '}
                <code className="inline-code">--agent</code> slugs, or open the full playbook on
                GitHub.
              </p>
            </div>

            <div className="terminal-mode-switch" role="group" aria-label="Runbooks CLI mode">
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
