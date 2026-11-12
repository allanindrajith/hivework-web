import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Search,
  Sparkles,
  Terminal,
  UserCheck,
} from 'lucide-react';
import type { EmployeeEntry } from '../data/types';
import { copyText } from '../lib/clipboard';
import '../styles/sections.css';

export interface EmployeesSectionProps {
  employees: EmployeeEntry[];
  repoUrl?: string;
}

const DEFAULT_REPO_URL = 'https://github.com/allanindrajith/hivework';

export function EmployeesSection({ employees, repoUrl }: EmployeesSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [copiedInstaller, setCopiedInstaller] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.objective.toLowerCase().includes(q) ||
        emp.slug.toLowerCase().includes(q) ||
        emp.routines.some((r) => r.toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  const handleCopyHire = async (slug: string) => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const command = `./scripts/install.sh --skill hive-hire`;
    const ok = await copyText(command);
    if (ok) {
      setCopiedSlug(slug);
      resetTimerRef.current = window.setTimeout(() => {
        setCopiedSlug(null);
        resetTimerRef.current = null;
      }, 2400);
    }
  };

  const handleCopyInstaller = async () => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const command = `./scripts/install.sh --skill hive-hire`;
    const ok = await copyText(command);
    if (ok) {
      setCopiedInstaller(true);
      resetTimerRef.current = window.setTimeout(() => {
        setCopiedInstaller(false);
        resetTimerRef.current = null;
      }, 2400);
    }
  };

  const effectiveRepo = (repoUrl ?? '').trim() || DEFAULT_REPO_URL;

  return (
    <section id="employees" className="workforce-section employees-section" aria-labelledby="employees-heading">
      <div className="container">
        <div className="section-header-block">
          <p className="section-eyebrow">AUTONOMOUS AI EMPLOYEES · SCHEDULED WORKFORCE</p>
          <h2 id="employees-heading" className="section-heading">
            8 autonomous AI employees with self-executing routines
          </h2>
          <p className="section-lead">
            Hivework AI Employees are self-contained operational units with automated cron routines,
            daily standups, and independent review loops. Hire them into any folder using the
            canonical <code className="inline-code">hive-hire</code> skill.
          </p>
        </div>

        {/* Global Hire Banner */}
        <div className="hairline-card employee-hire-banner">
          <div className="employee-hire-info">
            <div className="employee-hire-badge">
              <Sparkles size={14} aria-hidden="true" />
              <span>Hiring Protocol</span>
            </div>
            <h3 className="employee-hire-title">Hire employees with the hive-hire skill</h3>
            <p className="employee-hire-desc">
              Run <code className="inline-code">./scripts/install.sh --skill hive-hire</code> to install
              the universal hiring manager into Claude Code, Cursor, Codex, OpenCode, or Antigravity,
              then invoke <code className="inline-code">/hive-hire &lt;slug&gt;</code> to deploy.
            </p>
          </div>
          <div className="employee-hire-actions">
            <button
              type="button"
              className="btn-primary"
              onClick={handleCopyInstaller}
              aria-label="Copy hive-hire install command"
            >
              {copiedInstaller ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              <span>{copiedInstaller ? 'Copied' : './scripts/install.sh --skill hive-hire'}</span>
            </button>
            <a
              href={`${effectiveRepo}/blob/main/skills/hive-hire/SKILL.md`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              <span>hive-hire Guide</span>
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="workforce-toolbar">
          <div className="workforce-search-wrap">
            <Search size={16} className="workforce-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="workforce-search-input"
              placeholder="Search 8 AI employees or routines (e.g. gtm, chief of staff, seo, sales)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search employees"
            />
          </div>
          <p className="workforce-count">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="workforce-empty hairline-card">
            <p className="workforce-empty-title">No employees match &ldquo;{searchQuery}&rdquo;</p>
            <p className="workforce-empty-body">
              Try searching by function like &ldquo;sales&rdquo;, &ldquo;seo&rdquo;, &ldquo;ad&rdquo;, or &ldquo;web&rdquo;.
            </p>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setSearchQuery('')}
            >
              Reset filter
            </button>
          </div>
        ) : (
          <div className="grid-responsive workforce-grid employees-grid">
            {filteredEmployees.map((emp) => {
              const isCopied = copiedSlug === emp.slug;
              return (
                <article key={emp.slug} className="hairline-card employee-card" aria-labelledby={`emp-title-${emp.slug}`}>
                  <div className="employee-card-header">
                    <div className="employee-title-group">
                      <div className="employee-avatar">
                        <Briefcase size={18} aria-hidden="true" />
                      </div>
                      <div>
                        <h3 id={`emp-title-${emp.slug}`} className="employee-card-name">
                          {emp.name}
                        </h3>
                        <p className="employee-card-role">{emp.role}</p>
                      </div>
                    </div>
                    <span className="pill-badge employee-version-badge">v{emp.version}</span>
                  </div>

                  <div className="employee-objective-box">
                    <p className="employee-objective-label">OBJECTIVE</p>
                    <p className="employee-objective-text">{emp.objective}</p>
                  </div>

                  <div className="employee-cadence-row">
                    <div className="employee-cadence-item">
                      <Clock size={12} aria-hidden="true" />
                      <span>Standup: <code className="inline-code">{emp.standup}</code></span>
                    </div>
                    <div className="employee-cadence-item">
                      <UserCheck size={12} aria-hidden="true" />
                      <span>Reviewer: <code className="inline-code">{emp.reviewer}</code></span>
                    </div>
                  </div>

                  <div className="employee-routines-box">
                    <div className="employee-routines-header">
                      <span className="employee-routines-count">{emp.routineCount} Automated Routines</span>
                    </div>
                    <div className="employee-routine-chips">
                      {emp.routines.slice(0, 4).map((routine) => (
                        <span key={routine} className="employee-routine-chip">
                          {routine}
                        </span>
                      ))}
                      {emp.routines.length > 4 ? (
                        <span className="employee-routine-chip employee-routine-more">
                          +{emp.routines.length - 4} more
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="employee-card-actions">
                    <button
                      type="button"
                      className="btn-outline employee-hire-btn"
                      onClick={() => handleCopyHire(emp.slug)}
                      aria-label={`Copy hire command for ${emp.name}`}
                    >
                      {isCopied ? <Check size={14} aria-hidden="true" /> : <Terminal size={14} aria-hidden="true" />}
                      <span>{isCopied ? 'Copied' : `Hire ${emp.slug}`}</span>
                    </button>

                    <a
                      href={`${effectiveRepo}/tree/main/${emp.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline employee-source-link"
                      aria-label={`View ${emp.name} source on GitHub`}
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
