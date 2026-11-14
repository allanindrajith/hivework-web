import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Bot, Check, Copy, ExternalLink, Terminal } from 'lucide-react';
import type { CatalogTotals, CliCommandMode, SiteConfig } from '../data/types';
import { useDesktopRelease } from '../hooks/useDesktopRelease';
import {
  MAC_AGENT_INSTALL_PROMPT,
  MAC_QUARANTINE_CMD,
  WIN_AGENT_INSTALL_PROMPT,
  WIN_UNBLOCK_CMD,
} from '../data/desktopRelease';
import { AppleLogo } from './icons/AppleLogo';
import { WindowsLogo } from './icons/WindowsLogo';
import { buildBootstrapCommand } from '../lib/cliBuilder';
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
  caption: (totals: CatalogTotals) => string;
}

const DEFAULT_REPO_URL = 'https://github.com/allanindrajith/hivework';

const QUICK_START_TABS: readonly QuickStartTab[] = [
  {
    id: 'install-all',
    label: 'Install All',
    localCommand: './scripts/install.sh',
    caption: () =>
      'Auto-detects installed local AI harnesses and deploys compatible agents interactively. Nothing detected? Add --tool <name>.',
  },
  {
    id: 'install-skills',
    label: 'Install Skills',
    localCommand: './scripts/install.sh --skills',
    caption: (totals) =>
      `Installs all ${totals.skills} modular cross-tool SKILL.md workflows alongside your chosen agent teams.`,
  },
  {
    id: 'convert-all',
    label: 'Convert All',
    localCommand: './scripts/convert.sh --parallel',
    caption: () =>
      'Compiles canonical Markdown personas into native harness artifacts across integrations/.',
  },
];

export function HeroSection({ totals, site }: HeroSectionProps) {
  const desktop = useDesktopRelease();
  const [activeTabId, setActiveTabId] = useState<QuickStartTabId>('install-all');
  const [cliMode, setCliMode] = useState<CliCommandMode>('local');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [activeOS, setActiveOS] = useState<'mac' | 'windows'>('mac');
  const [macNoticeMode, setMacNoticeMode] = useState<'terminal' | 'agent'>('terminal');
  const [macNoticeCopied, setMacNoticeCopied] = useState<boolean>(false);
  const resetTimerRef = useRef<number | null>(null);

  const activeTab =
    QUICK_START_TABS.find((tab) => tab.id === activeTabId) ?? QUICK_START_TABS[0];

  const activeCommand =
    cliMode === 'bootstrap'
      ? buildBootstrapCommand(activeTab.localCommand, site.repoUrl)
      : activeTab.localCommand;

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

  const currentNoticeCommand =
    activeOS === 'mac'
      ? (macNoticeMode === 'terminal' ? MAC_QUARANTINE_CMD : MAC_AGENT_INSTALL_PROMPT)
      : (macNoticeMode === 'terminal' ? WIN_UNBLOCK_CMD : WIN_AGENT_INSTALL_PROMPT);

  const handleCopyMacNotice = async () => {
    const ok = await copyText(currentNoticeCommand);
    if (ok) {
      setMacNoticeCopied(true);
      window.setTimeout(() => setMacNoticeCopied(false), 2000);
    }
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
      <div className="hero-preloader-bar" aria-hidden="true" />
      <div className="container hero-grid">
        <div>
          <p className="section-eyebrow hero-animate hero-delay-1">
            HIVEWORK OPERATOR HUB · {site.domain.toUpperCase()}
          </p>

          <h1 id="hero-heading" className="hero-title hero-animate hero-delay-2">
            One canonical <span className="hero-highlight">AI workforce</span> across every coding harness.
          </h1>

          <p className="hero-subtitle hero-animate hero-delay-3">
            Browse, select, and install {totals.agents} specialized Markdown agents across{' '}
            {totals.divisions} divisions, {totals.skills} modular <code className="inline-code">SKILL.md</code>{' '}
            workflows, {totals.employees} autonomous AI employees, and {totals.reviewers} Goldfish
            reviewers into Claude Code, Cursor, Antigravity, Codex, OpenCode, Gemini CLI, and{' '}
            {totals.tools} local tools.
          </p>

          <div className="hero-actions-container">
            <div className="hero-actions-primary hero-animate hero-delay-4">
              <a
                href="/harnesses"
                className="btn-primary hero-btn-main"
                onClick={(e) => navigateToSection('model-matrix', e)}
              >
                <span>Connect {totals.tools} Harnesses</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a
                href={desktop.dmgUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline hero-mac-btn"
                title={`Download Hivework ${desktop.displayVersion} on GitHub Releases`}
              >
                <AppleLogo size={14} aria-hidden="true" />
                <span>macOS App ({desktop.displayVersion})</span>
              </a>
              <a
                href={desktop.windowsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline hero-win-btn"
                title={`Download Hivework ${desktop.displayVersion} on GitHub Releases`}
              >
                <WindowsLogo size={14} aria-hidden="true" />
                <span>Windows App ({desktop.displayVersion})</span>
              </a>
            </div>

            <div className="hero-mac-notice hero-animate hero-delay-4" role="region" aria-label="macOS installation instructions">
              <div className="hero-mac-notice-header">
                <div className="hero-os-toggle" role="tablist" aria-label="Desktop Operating System">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeOS === 'mac'}
                    className={`hero-os-toggle-btn ${activeOS === 'mac' ? 'active' : ''}`}
                    onClick={() => setActiveOS('mac')}
                  >
                    <AppleLogo size={11} aria-hidden="true" />
                    <span>macOS</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeOS === 'windows'}
                    className={`hero-os-toggle-btn ${activeOS === 'windows' ? 'active' : ''}`}
                    onClick={() => setActiveOS('windows')}
                  >
                    <WindowsLogo size={11} aria-hidden="true" />
                    <span>Windows</span>
                  </button>
                </div>

                <span className="hero-mac-notice-badge">
                  {activeOS === 'mac' ? 'macOS Gatekeeper' : 'Windows SmartScreen'}
                </span>
                <span className="hero-mac-notice-text">
                  {activeOS === 'mac' ? (
                    <>Unsigned app? Move <code>Hivework.app</code> to <code>/Applications</code>, then:</>
                  ) : (
                    <>Unsigned app? Click <code>More info</code> &rarr; <code>Run anyway</code>, or in PowerShell:</>
                  )}
                </span>
                <div className="hero-mac-notice-tabs" role="tablist" aria-label="macOS install method">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={macNoticeMode === 'terminal'}
                    className={`hero-mac-notice-tab ${macNoticeMode === 'terminal' ? 'active' : ''}`}
                    onClick={() => setMacNoticeMode('terminal')}
                  >
                    <Terminal size={11} aria-hidden="true" />
                    <span>{activeOS === 'mac' ? 'Terminal' : 'PowerShell'}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={macNoticeMode === 'agent'}
                    className={`hero-mac-notice-tab ${macNoticeMode === 'agent' ? 'active' : ''}`}
                    onClick={() => setMacNoticeMode('agent')}
                  >
                    <Bot size={11} aria-hidden="true" />
                    <span>AI Agent Prompt</span>
                  </button>
                </div>
              </div>

              <div className="hero-mac-notice-box">
                <code>
                  {currentNoticeCommand}
                </code>
                <button
                  type="button"
                  className="hero-mac-notice-copy-btn"
                  onClick={handleCopyMacNotice}
                  title={`Copy ${macNoticeMode === 'terminal' ? (activeOS === 'mac' ? 'Terminal command' : 'PowerShell command') : 'AI Agent prompt'}`}
                  aria-label={`Copy ${macNoticeMode === 'terminal' ? (activeOS === 'mac' ? 'Terminal command' : 'PowerShell command') : 'AI Agent prompt'}`}
                >
                  {macNoticeCopied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
                  <span>{macNoticeCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="hero-actions-sub hero-animate hero-delay-5" role="group" aria-label="Catalog direct links">
              <a
                href="/agents"
                className="hero-sub-link"
                onClick={(e) => navigateToSection('workforce', e)}
              >
                Browse {totals.agents} Agents
              </a>
              <span className="hero-sub-sep" aria-hidden="true">·</span>
              <a
                href="/employees"
                className="hero-sub-link"
                onClick={(e) => navigateToSection('employees', e)}
              >
                Hire {totals.employees} Employees
              </a>
              <span className="hero-sub-sep" aria-hidden="true">·</span>
              <a
                href="/skills"
                className="hero-sub-link"
                onClick={(e) => navigateToSection('skills', e)}
              >
                Explore {totals.skills} Skills
              </a>
              {repoHref ? (
                <>
                  <span className="hero-sub-sep" aria-hidden="true">·</span>
                  <a
                    href={repoHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-sub-link"
                  >
                    <span>Source Repository</span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                </>
              ) : null}
            </div>
          </div>

          <dl className="hero-stats" aria-label="Verified catalog metrics">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className={`hero-stat-card hero-animate hero-delay-${idx + 7}`}
              >
                <dt className="hero-stat-label">{stat.label}</dt>
                <dd className="hero-stat-value">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="terminal-window hero-terminal hero-animate hero-delay-6"
          role="region"
          aria-label="Quick-start CLI commands"
        >
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

            <p className="terminal-caption">{activeTab.caption(totals)}</p>

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
