import { ExternalLink } from 'lucide-react';
import type { SiteConfig } from '../data/types';
import '../styles/landing.css';

export interface HeaderNavProps {
  site: SiteConfig;
}

const NAV_ITEMS = [
  { href: '#story', label: 'Story' },
  { href: '#model-matrix', label: 'Model Matrix' },
  { href: '#workforce', label: 'Workforce' },
  { href: '#contact', label: 'Contact' },
] as const;

function resolveRepoHref(site: SiteConfig): string | null {
  return (
    [site.repoUrl, site.githubUrl]
      .map((value) => (value ?? '').trim())
      .find((value) => value.length > 0 && value !== '#') ?? null
  );
}

export function HeaderNav({ site }: HeaderNavProps) {
  const creatorHref = site.creatorUrl.trim();
  const repoHref = resolveRepoHref(site);

  return (
    <header className="site-header" id="top">
      <div className="container site-header-inner">
        <a href="#hero" className="brand-link" aria-label="Hivework home">
          <img src="./logo.svg" alt="Hivework" className="brand-logo" width={152} height={36} />
        </a>

        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className="site-nav-link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-header-actions">
          {creatorHref && creatorHref !== '#' ? (
            <a
              href={creatorHref}
              target="_blank"
              rel="noopener noreferrer"
              className="pill-badge creator-pill"
            >
              <span>itsallan.me</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          ) : null}

          {repoHref ? (
            <a
              href={repoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline header-repo-btn"
            >
              GitHub
            </a>
          ) : null}

          <a href="#model-matrix" className="btn-primary btn-pill header-cta">
            Connect Models
          </a>
        </div>
      </div>
    </header>
  );
}
