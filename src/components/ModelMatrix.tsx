import { useEffect, useMemo, useRef, useState } from 'react';
import { Apple, Check, Copy, Download, Terminal } from 'lucide-react';
import type { CliCommandMode, DivisionEntry, ToolEntry } from '../data/types';
import { buildInstallCommand } from '../lib/cliBuilder';
import { copyText } from '../lib/clipboard';
import '../styles/sections.css';

export interface ModelMatrixProps {
  tools: ToolEntry[];
  divisions: DivisionEntry[];
}

type InstallFilter = 'all' | ToolEntry['installKind'];

function formatScope(tool: ToolEntry): string {
  if (tool.scope.user && tool.scope.project) {
    return 'User & Project';
  }
  if (tool.scope.user) {
    return 'User only';
  }
  if (tool.scope.project) {
    return 'Project only';
  }
  return 'Custom';
}

export function ModelMatrix({ tools, divisions }: ModelMatrixProps) {
  const orderedTools = useMemo(
    () => [...tools].sort((a, b) => a.order - b.order),
    [tools]
  );

  const [activeFilter, setActiveFilter] = useState<InstallFilter>('all');
  const [selectedToolId, setSelectedToolId] = useState<string>(orderedTools[0]?.id ?? '');
  const [selectedDivision, setSelectedDivision] = useState<string>('');
  const [skills, setSkills] = useState<boolean>(false);
  const [link, setLink] = useState<boolean>(false);
  const [dryRun, setDryRun] = useState<boolean>(false);
  const [cliMode, setCliMode] = useState<CliCommandMode>('local');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimerRef = useRef<number | null>(null);

  const counts = useMemo(() => {
    let perAgent = 0;
    let roster = 0;
    let plugin = 0;
    for (const tool of orderedTools) {
      if (tool.installKind === 'per-agent') perAgent += 1;
      else if (tool.installKind === 'roster') roster += 1;
      else if (tool.installKind === 'plugin') plugin += 1;
    }
    return {
      all: orderedTools.length,
      perAgent,
      roster,
      plugin,
    };
  }, [orderedTools]);

  const filteredTools = useMemo(() => {
    if (activeFilter === 'all') {
      return orderedTools;
    }
    return orderedTools.filter((tool) => tool.installKind === activeFilter);
  }, [activeFilter, orderedTools]);

  const activeTool =
    filteredTools.find((tool) => tool.id === selectedToolId) ??
    filteredTools[0] ??
    orderedTools[0];

  const installCommand = useMemo(
    () =>
      buildInstallCommand({
        mode: cliMode,
        tool: activeTool?.kebab,
        division: selectedDivision || undefined,
        skills,
        link,
        dryRun,
      }),
    [cliMode, activeTool?.kebab, selectedDivision, skills, link, dryRun]
  );

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const resetCopyStatus = () => {
    setCopyState('idle');
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
  };

  const handleFilterChange = (nextFilter: InstallFilter) => {
    setActiveFilter(nextFilter);
    resetCopyStatus();
  };

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId);
    resetCopyStatus();
  };

  const handleCopy = async () => {
    resetCopyStatus();
    const ok = await copyText(installCommand);
    setCopyState(ok ? 'copied' : 'failed');
    resetTimerRef.current = window.setTimeout(() => {
      setCopyState('idle');
      resetTimerRef.current = null;
    }, 2400);
  };

  const filterOptions: Array<{ id: InstallFilter; label: string }> = [
    { id: 'all', label: `All (${counts.all})` },
    { id: 'per-agent', label: `Per-Agent (${counts.perAgent})` },
    { id: 'roster', label: `Roster (${counts.roster})` },
    { id: 'plugin', label: `Plugin (${counts.plugin})` },
  ];

  return (
    <section id="model-matrix" className="matrix-section" aria-labelledby="model-matrix-heading">
      <div className="container">
        <div className="section-header-block">
          <p className="section-eyebrow">COMPATIBILITY MATRIX · {orderedTools.length} HARNESSES</p>
          <h2 id="model-matrix-heading" className="section-heading">
            Target any local AI tool without rewriting personas
          </h2>
          <p className="section-lead">
            Filter by installation model to inspect exact config formats, user vs. project
            destinations, and generate a ready-to-run <code className="inline-code">install.sh</code>{' '}
            command.
          </p>
        </div>

        <div className="matrix-filters" role="group" aria-label="Filter harnesses by install kind">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              className="matrix-filter-btn"
              aria-pressed={activeFilter === option.id}
              onClick={() => handleFilterChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <aside className="matrix-download-card" aria-label="Hivework for macOS">
          <div className="matrix-download-content">
            <div className="matrix-download-badge-row">
              <span className="pill-badge pill-badge-mac">
                <Apple size={13} aria-hidden="true" />
                <span>macOS Desktop App</span>
              </span>
              <span className="matrix-download-version">v0.4.0 · Apple Silicon &amp; Intel</span>
            </div>
            <h3 className="matrix-download-title">Prefer a native desktop GUI on your Mac?</h3>
            <p className="matrix-download-desc">
              Download Hivework directly to macOS to visually inspect, configure, and switch between all {orderedTools.length} harnesses and 345 agent personas—no terminal required.
            </p>
          </div>
          <div className="matrix-download-action">
            <a
              href="/downloads/Hivework.dmg"
              download="Hivework.dmg"
              className="btn-primary matrix-download-btn"
            >
              <Download size={16} aria-hidden="true" />
              <span>Download for macOS</span>
              <span className="matrix-download-filetag">DMG · 9.3 MB</span>
            </a>
          </div>
        </aside>

        <div className="matrix-layout">
          <div className="matrix-tool-grid" role="group" aria-label="AI coding harnesses">
            {filteredTools.map((tool) => {
              const isSelected = activeTool?.id === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  className="matrix-tool-btn"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectTool(tool.id)}
                >
                  <span className="matrix-tool-identity">
                    <span
                      className="status-dot"
                      style={{ backgroundColor: tool.accent }}
                      aria-hidden="true"
                    />
                    <span className="matrix-tool-name">{tool.label}</span>
                  </span>
                  <span className="matrix-tool-format">{tool.installKind}</span>
                </button>
              );
            })}
          </div>

          {activeTool ? (
            <div className="hairline-card matrix-inspector" aria-label="Harness specification inspector">
              <div className="matrix-inspector-header">
                <div className="matrix-inspector-title-wrap">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: activeTool.accent }}
                    aria-hidden="true"
                  />
                  <h3 className="matrix-inspector-title">{activeTool.label}</h3>
                </div>

                <div className="matrix-inspector-badges">
                  <span className="pill-badge">{activeTool.installKind}</span>
                  <code className="inline-code">{activeTool.kebab}</code>
                </div>
              </div>

              <dl className="matrix-spec-list">
                <div className="matrix-spec-item">
                  <dt className="matrix-spec-label">Format</dt>
                  <dd className="matrix-spec-value">
                    <code className="inline-code">{activeTool.format}</code>
                  </dd>
                </div>

                <div className="matrix-spec-item">
                  <dt className="matrix-spec-label">Install Kind</dt>
                  <dd className="matrix-spec-value">{activeTool.installKind}</dd>
                </div>

                <div className="matrix-spec-item">
                  <dt className="matrix-spec-label">Scope</dt>
                  <dd className="matrix-spec-value">{formatScope(activeTool)}</dd>
                </div>

                <div className="matrix-spec-item">
                  <dt className="matrix-spec-label">Version Probe</dt>
                  <dd className="matrix-spec-value">
                    <code className="inline-code">
                      {[activeTool.version.bin, ...activeTool.version.args].join(' ')}
                    </code>
                  </dd>
                </div>

                <div className="matrix-spec-item matrix-spec-item-wide">
                  <dt className="matrix-spec-label">User Destination</dt>
                  <dd className="matrix-spec-value">
                    {activeTool.dest.user.length > 0 ? (
                      activeTool.dest.user.map((destPath) => (
                        <code key={destPath} className="inline-code">
                          {destPath}
                        </code>
                      ))
                    ) : (
                      <span className="matrix-muted">Not supported (project-scoped)</span>
                    )}
                  </dd>
                </div>

                <div className="matrix-spec-item matrix-spec-item-wide">
                  <dt className="matrix-spec-label">Project Destination</dt>
                  <dd className="matrix-spec-value">
                    {activeTool.dest.project.length > 0 ? (
                      activeTool.dest.project.map((destPath) => (
                        <code key={destPath} className="inline-code">
                          {destPath}
                        </code>
                      ))
                    ) : (
                      <span className="matrix-muted">Not supported (user-scoped)</span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="matrix-builder-controls">
                <div className="matrix-select-row">
                  <label htmlFor="matrix-division-select" className="matrix-control-label">
                    Division (--division)
                  </label>
                  <select
                    id="matrix-division-select"
                    className="matrix-select"
                    value={selectedDivision}
                    onChange={(event) => {
                      setSelectedDivision(event.target.value);
                      resetCopyStatus();
                    }}
                  >
                    <option value="">All divisions</option>
                    {divisions.map((division) => (
                      <option key={division.id} value={division.slug}>
                        {division.label} ({division.agentCount})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="matrix-flag-row">
                  <label
                    className={
                      skills ? 'matrix-flag-toggle matrix-flag-toggle-active' : 'matrix-flag-toggle'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={skills}
                      onChange={(event) => {
                        setSkills(event.target.checked);
                        resetCopyStatus();
                      }}
                    />
                    <code>--skills</code>
                    <span className="matrix-flag-desc">Modular skills</span>
                  </label>

                  <label
                    className={
                      link ? 'matrix-flag-toggle matrix-flag-toggle-active' : 'matrix-flag-toggle'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={link}
                      onChange={(event) => {
                        setLink(event.target.checked);
                        resetCopyStatus();
                      }}
                    />
                    <code>--link</code>
                    <span className="matrix-flag-desc">Symlink files</span>
                  </label>

                  <label
                    className={
                      dryRun ? 'matrix-flag-toggle matrix-flag-toggle-active' : 'matrix-flag-toggle'
                    }
                  >
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={(event) => {
                        setDryRun(event.target.checked);
                        resetCopyStatus();
                      }}
                    />
                    <code>--dry-run</code>
                    <span className="matrix-flag-desc">Preview plan</span>
                  </label>
                </div>

                <div className="terminal-window">
                  <div className="terminal-header">
                    <div className="terminal-dots" aria-hidden="true">
                      <span className="terminal-dot terminal-dot-active" />
                      <span className="terminal-dot" />
                      <span className="terminal-dot" />
                    </div>
                    <span className="terminal-title">
                      <Terminal size={12} aria-hidden="true" />
                      <span>install.sh</span>
                    </span>
                    <div className="terminal-mode-switch" role="group" aria-label="Matrix CLI mode">
                      <button
                        type="button"
                        className="terminal-mode-btn"
                        aria-pressed={cliMode === 'local'}
                        onClick={() => {
                          setCliMode('local');
                          resetCopyStatus();
                        }}
                      >
                        Local CLI
                      </button>
                      <button
                        type="button"
                        className="terminal-mode-btn"
                        aria-pressed={cliMode === 'bootstrap'}
                        onClick={() => {
                          setCliMode('bootstrap');
                          resetCopyStatus();
                        }}
                      >
                        Git Clone + Run
                      </button>
                    </div>
                  </div>

                  <div className="terminal-body">
                    <pre className="terminal-code-wrap">
                      <span className="terminal-prompt" aria-hidden="true">
                        &gt;
                      </span>
                      <code className="terminal-command">{installCommand}</code>
                    </pre>

                    <div className="terminal-footer">
                      <button
                        type="button"
                        className="terminal-copy-btn"
                        onClick={handleCopy}
                        aria-label="Copy install command"
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
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
