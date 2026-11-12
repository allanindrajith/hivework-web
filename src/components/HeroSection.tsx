import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Copy, Terminal } from 'lucide-react';
import type { CatalogTotals, SiteConfig } from '../data/types';
import { copyText } from '../lib/clipboard';
import '../styles/landing.css';

export interface HeroSectionProps {
  totals: CatalogTotals;
  site: SiteConfig;
}

type QuickStartTabId = 'install-all' | 'install-skills' | 'convert-all';

interface QuickStartTab {
  id: QuickStartTabId;
  label: string;
  command: string;
  caption: string;
}

const QUICK_START_TABS: readonly QuickStartTab[] = [
  {
    id: 'install-all',
    label: 'Install All',
    command: './scripts/install.sh',
    caption: 'Auto-detects installed local AI harnesses and deploys compatible agents interactively.',
  },
  {
    id: 'install-skills',
    label: 'Install Skills',
    command: './scripts/install.sh --skills',
    caption: 'Installs modular cross-tool skill directories alongside your chosen agent teams.',
  },
  {
    id: 'convert-all',
    label: 'Convert All',
    command: './scripts/convert.sh --parallel',
    caption: 'Compiles canonical Markdown personas into native harness artifacts across integrations/.',
  },
];

export function HeroSection({ totals, site }: HeroSectionProps) {
  const [activeTabId, setActiveTabId] = useState<QuickStartTabId>('install-all');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimerRef = useRef<number | null>(null);

  const activeTab =
    QUICK_START_TABS.find((tab) => tab.id === activeTabId) ?? QUICK_START_TABS[0];

  const repoHref =
    [site.repoUrl, site.githubUrl]
      .map((value) => (value ?? '').trim())
      .find((value) => value.length > 0 && value !== '#') ?? null;

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleSelectTab = (tabId: QuickStartTabId) => {
    setActiveTabId(tabId);
    setCopyState('idle');
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const handleCopy = async () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const ok = await copyText(activeTab.command);
    setCopyState(ok ? 'copied' : 'failed');

    resetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
      resetTimerRef.current = null;
    }, 2400);
  };

  const stats = [
    { label: 'Specialized Agents', value: totals.agents },
    { label: 'Workforce Divisions', value: totals.divisions },
    { label: 'AI Harnesses', value: totals.tools },
    { label: 'Modular Skills', value: totals.skills },
  ];

  return (
    <section id="hero" className="hero-section" aria-labelledby="hero-heading">
      <div className="container hero-grid">
        <div>
          <p className="section-eyebrow">
            HIVEWORK · {site.domain.toUpperCase()}
          </p>

          <h1 id="hero-heading" className="hero-title">
            One canonical AI workforce across every coding harness.
          </h1>

          <p className="hero-subtitle">
            Deploy {totals.agents} specialized Markdown agent personas across {totals.divisions} divisions
            and {totals.skills} modular skills directly into Claude Code, Cursor, Codex, OpenCode,
            Gemini CLI, and {totals.tools} total local tools—without vendor lock-in.
          </p>

          <div className="hero-actions">
            <a href="#model-matrix" className="btn-primary">
              <span>Connect {totals.tools} Harnesses</span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a href="#workforce" className="btn-outline">
              Explore {totals.divisions} Divisions
            </a>
            {repoHref ? (
              <a
                href={repoHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                Source Repository
              </a>
            ) : null}
          </div>

          <dl className="hero-stats" aria-label="Verified catalog metrics">
            {stats.map((stat) => (
              <div key={stat.label} className="hero-stat-card">
                <dt className="hero-stat-label">{stat.label}</dt>
                <dd className="hero-stat-value">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="terminal-window hero-terminal" role="region" aria-label="Quick-start CLI commands">
          <div className="terminal-header">
            <div className="terminal-dots" aria-hidden="true">
              <span className="terminal-dot terminal-dot-active" />
              <span className="terminal-dot" />
              <span className="terminal-dot" />
            </div>
            <span className="terminal-title">
              <Terminal size={12} aria-hidden="true" />
              <span>quick-start.sh</span>
            </span>
          </div>

          <div className="terminal-tabs" role="group" aria-label="Quick-start presets">
            {QUICK_START_TABS.map((tab) => {
              const isSelected = tab.id === activeTab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="terminal-tab-btn"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="terminal-body">
            <pre className="terminal-code-wrap">
              <span className="terminal-prompt" aria-hidden="true">
                &gt;
              </span>
              <code className="terminal-command">{activeTab.command}</code>
            </pre>

            <p className="terminal-caption">{activeTab.caption}</p>

            <div className="terminal-footer">
              <button
                type="button"
                className="terminal-copy-btn"
                onClick={handleCopy}
                aria-label="Copy command"
              >
                {copyState === 'copied' ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
                <span>Copy command</span>
              </button>

              <span className="terminal-copy-status" role="status" aria-live="polite">
                {copyState === 'copied'
                  ? 'Copied'
                  : copyState === 'failed'
                    ? 'Copy failed — select manually'
                    : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
