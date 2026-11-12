import { Download, ExternalLink } from 'lucide-react';
import type { SiteConfig } from '../data/types';
import { useDesktopRelease } from '../hooks/useDesktopRelease';
import { navigateToSection, type SectionId } from '../lib/navigation';
import '../styles/landing.css';

export interface HeaderNavProps {
  site: SiteConfig;
}

const NAV_ITEMS: readonly { sectionId: SectionId; href: string; label: string }[] = [
  { sectionId: 'model-matrix', href: '/harnesses', label: 'Harnesses' },
  { sectionId: 'workforce', href: '/agents', label: 'Agents' },
  { sectionId: 'skills', href: '/skills', label: 'Skills' },
  { sectionId: 'employees', href: '/employees', label: 'Employees' },
  { sectionId: 'runbooks', href: '/runbooks', label: 'Runbooks' },
  { sectionId: 'story', href: '/architecture', label: 'Architecture' },
  { sectionId: 'contact', href: '/contact', label: 'Contact' },
] as const;

function resolveRepoHref(site: SiteConfig): string | null {
  return (
    [site.repoUrl, site.githubUrl]
      .map((value) => (value ?? '').trim())
      .find((value) => value.length > 0 && value !== '#') ?? null
  );
}

export function HeaderNav({ site }: HeaderNavProps) {
  const desktop = useDesktopRelease();
  const creatorHref = site.creatorUrl.trim();
  const repoHref = resolveRepoHref(site);

  return (
    <header className="site-header" id="top">
      <div className="container site-header-inner">
        <a
          href="/"
          className="brand-link"
          aria-label="Hivework home"
          onClick={(e) => navigateToSection('hero', e)}
        >
          <img src="./logo.svg" alt="Hivework" className="brand-logo" width={152} height={36} />
        </a>

        <nav className="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="site-nav-link"
              onClick={(e) => navigateToSection(item.sectionId, e)}
            >
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

          <a
            href={desktop.dmgUrl}
            download="Hivework.dmg"
            className="btn-outline header-mac-btn"
            title={`Download Hivework ${desktop.displayVersion} for macOS (Universal DMG)`}
          >
            <Download size={13} aria-hidden="true" />
            <span>macOS App</span>
          </a>

          <a
            href="/harnesses"
            className="btn-primary btn-pill header-cta"
            onClick={(e) => navigateToSection('model-matrix', e)}
          >
            Connect Models
          </a>
        </div>
      </div>
    </header>
  );
}
