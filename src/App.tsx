import { useEffect } from 'react';
import rawCatalog from './data/catalog.generated.json';
import type { CatalogData } from './data/types';
import { siteConfig } from './data/site';
import { HeaderNav } from './components/HeaderNav';
import { HeroSection } from './components/HeroSection';
import { StorySection } from './components/StorySection';
import { ModelMatrix } from './components/ModelMatrix';
import { WorkforceSection } from './components/WorkforceSection';
import { SkillsSection } from './components/SkillsSection';
import { EmployeesSection } from './components/EmployeesSection';
import { ContactFooter } from './components/ContactFooter';
import { getSectionPath, resolveSectionFromPath } from './lib/navigation';
import './styles/tokens.css';
import './styles/landing.css';
import './styles/sections.css';

const catalog = rawCatalog as CatalogData;

export function App() {
  useEffect(() => {
    const syncUrlAndScroll = () => {
      const sectionId = resolveSectionFromPath(
        window.location.pathname,
        window.location.hash
      );
      const cleanPath = getSectionPath(sectionId);

      // Strip any legacy #hero or #section hash from the URL bar immediately
      if (window.location.hash && window.history?.replaceState) {
        try {
          window.history.replaceState({ sectionId }, '', cleanPath);
        } catch {
          // Ignore in restricted environments
        }
      }

      if (sectionId !== 'hero') {
        const el = document.getElementById(sectionId);
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    syncUrlAndScroll();
    window.addEventListener('popstate', syncUrlAndScroll);
    return () => window.removeEventListener('popstate', syncUrlAndScroll);
  }, []);

  return (
    <div className="site-shell">
      <a
        href="/"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('main-content');
          main?.focus();
        }}
      >
        Skip to main content
      </a>

      <HeaderNav site={siteConfig} />

      <main id="main-content" tabIndex={-1}>
        <HeroSection totals={catalog.totals} site={siteConfig} />
        <ModelMatrix tools={catalog.tools} divisions={catalog.divisions} />
        <WorkforceSection
          divisions={catalog.divisions}
          runbooks={catalog.runbooks}
          repoUrl={siteConfig.repoUrl}
        />
        <SkillsSection
          skills={catalog.skills}
          reviewers={catalog.reviewers}
          repoUrl={siteConfig.repoUrl}
        />
        <EmployeesSection
          employees={catalog.employees}
          repoUrl={siteConfig.repoUrl}
        />
        <StorySection totals={catalog.totals} site={siteConfig} />
      </main>

      <ContactFooter site={siteConfig} />
    </div>
  );
}

export default App;
