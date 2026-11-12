import { useEffect, useRef, useState } from 'react';
import { Apple, ArrowRight, Check, Copy, ExternalLink, Terminal } from 'lucide-react';
import type { CatalogTotals, CliCommandMode, SiteConfig } from '../data/types';
import { useDesktopRelease } from '../hooks/useDesktopRelease';
import { copyText } from '../lib/clipboard';
import { navigateToSection } from '../lib/navigation';
import '../styles/landing.css';

export interface HeroSectionProps {
  totals: CatalogTotals;
  site: SiteConfig;
}

type QuickStartTabId = 'install-all' | 'install-skills' | 'convert-all';

interface QuickStartTab {
  id: QuickStartTabId;
  label: string;
  localCommand: string;
  bootstrapCommand: string;
  caption: string;
}

const DEFAULT_REPO_URL = 'https://github.com/allanindrajith/hivework';

const QUICK_START_TABS: readonly QuickStartTab[] = [
  {
    id: 'install-all',
    label: 'Install All',
    localCommand: './scripts/install.sh',
    bootstrapCommand:
      'git clone https://github.com/allanindrajith/hivework.git && cd hivework && ./scripts/install.sh',
    caption: 'Auto-detects installed local AI harnesses and deploys compatible agents interactively.',
  },
  {
    id: 'install-skills',
    label: 'Install Skills',
    localCommand: './scripts/install.sh --skills',
    bootstrapCommand:
      'git clone https://github.com/allanindrajith/hivework.git && cd hivework && ./scripts/install.sh --skills',
    caption: 'Installs all 25 modular cross-tool SKILL.md workflows alongside your chosen agent teams.',
  },
  {
    id: 'convert-all',
    label: 'Convert All',
    localCommand: './scripts/convert.sh --parallel',
    bootstrapCommand:
      'git clone https://github.com/allanindrajith/hivework.git && cd hivework && ./scripts/convert.sh --parallel',
    caption: 'Compiles canonical Markdown personas into native harness artifacts across integrations/.',
  },
];

export function HeroSection({ totals, site }: HeroSectionProps) {
  const desktop = useDesktopRelease();
  const [activeTabId, setActiveTabId] = useState<QuickStartTabId>('install-all');
  const [cliMode, setCliMode] = useState<CliCommandMode>('local');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimerRef = useRef<number | null>(null);

  const activeTab =
    QUICK_START_TABS.find((tab) => tab.id === activeTabId) ?? QUICK_START_TABS[0];

  const activeCommand =
    cliMode === 'bootstrap' ? activeTab.bootstrapCommand : activeTab.localCommand;

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

  const resetCopy = () => {
    setCopyState('idle');
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const handleSelectTab = (tabId: QuickStartTabId) => {
    setActiveTabId(tabId);
    resetCopy();
  };

  const handleModeChange = (mode: CliCommandMode) => {
    setCliMode(mode);
    resetCopy();
  };

  const handleCopy = async () => {
    resetCopy();
    const ok = await copyText(activeCommand);
    setCopyState(ok ? 'copied' : 'failed');

    resetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
      resetTimerRef.current = null;
    }, 2400);
  };

  const stats = [
    { label: 'Specialized Agents', value: totals.agents, sectionId: 'workforce' as const, href: '/agents' },
    { label: 'AI Employees', value: totals.employees, sectionId: 'employees' as const, href: '/employees' },
    { label: 'Workforce Divisions', value: totals.divisions, sectionId: 'workforce' as const, href: '/agents' },
    { label: 'AI Harnesses', value: totals.tools, sectionId: 'model-matrix' as const, href: '/harnesses' },
    { label: 'Modular Skills', value: totals.skills, sectionId: 'skills' as const, href: '/skills' },
  ];

  return (
    <section id="hero" className="hero-section" aria-labelledby="hero-heading">
      <div className="container hero-grid">
        <div>
          <p className="section-eyebrow">
            HIVEWORK OPERATOR HUB · {site.domain.toUpperCase()}
          </p>

          <h1 id="hero-heading" className="hero-title">
            One canonical AI workforce across every coding harness.
          </h1>

          <p className="hero-subtitle">
            Browse, select, and install {totals.agents} specialized Markdown agents across{' '}
            {totals.divisions} divisions, {totals.skills} modular <code className="inline-code">SKILL.md</code>{' '}
            workflows, {totals.employees} autonomous AI employees, and {totals.reviewers} Goldfish
            reviewers into Claude Code, Cursor, Antigravity, Codex, OpenCode, Gemini CLI, and{' '}
            {totals.tools} local tools.
          </p>

          <div className="hero-actions">
            <a
              href="/harnesses"
              className="btn-primary"
              onClick={(e) => navigateToSection('model-matrix', e)}
            >
              <span>Connect {totals.tools} Harnesses</span>
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <a
              href={desktop.dmgUrl}
              download="Hivework.dmg"
              className="btn-outline hero-mac-btn"
              title={`Download Hivework ${desktop.displayVersion} for macOS`}
            >
              <Apple size={14} aria-hidden="true" />
              <span>macOS App ({desktop.displayVersion})</span>
            </a>
            <a
              href="/agents"
              className="btn-outline"
              onClick={(e) => navigateToSection('workforce', e)}
            >
              Browse {totals.agents} Agents
            </a>
            <a
              href="/employees"
              className="btn-outline"
              onClick={(e) => navigateToSection('employees', e)}
            >
              Hire {totals.employees} Employees
            </a>
            <a
              href="/skills"
              className="btn-outline"
              onClick={(e) => navigateToSection('skills', e)}
            >
              Explore {totals.skills} Skills
            </a>
            {repoHref ? (
              <a
                href={repoHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <span>Source Repository</span>
                <ExternalLink size={14} aria-hidden="true" />
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
            <div className="terminal-mode-switch" role="group" aria-label="Command execution mode">
              <button
                type="button"
                className="terminal-mode-btn"
                aria-pressed={cliMode === 'local'}
                onClick={() => handleModeChange('local')}
              >
                Local CLI
              </button>
              <button
                type="button"
                className="terminal-mode-btn"
                aria-pressed={cliMode === 'bootstrap'}
                onClick={() => handleModeChange('bootstrap')}
              >
                Git Clone + Run
              </button>
            </div>
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
              <code className="terminal-command">{activeCommand}</code>
            </pre>

            <p className="terminal-caption">{activeTab.caption}</p>

            <div className="terminal-footer">
              <div className="terminal-footer-actions">
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

                <a
                  href={`${repoHref ?? DEFAULT_REPO_URL}/blob/main/scripts/install.sh`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="terminal-source-link"
                >
                  <span>install.sh source</span>
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </div>

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
