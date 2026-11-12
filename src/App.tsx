import rawCatalog from './data/catalog.generated.json';
import type { CatalogData } from './data/types';
import { siteConfig } from './data/site';
import { HeaderNav } from './components/HeaderNav';
import { HeroSection } from './components/HeroSection';
import { StorySection } from './components/StorySection';
import { ModelMatrix } from './components/ModelMatrix';
import { WorkforceSection } from './components/WorkforceSection';
import { ContactFooter } from './components/ContactFooter';
import './styles/tokens.css';
import './styles/landing.css';
import './styles/sections.css';

const catalog = rawCatalog as CatalogData;

export function App() {
  return (
    <div className="site-shell">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <HeaderNav site={siteConfig} />

      <main id="main-content">
        <HeroSection totals={catalog.totals} site={siteConfig} />
        <StorySection totals={catalog.totals} site={siteConfig} />
        <ModelMatrix tools={catalog.tools} divisions={catalog.divisions} />
        <WorkforceSection divisions={catalog.divisions} runbooks={catalog.runbooks} />
      </main>

      <ContactFooter site={siteConfig} />
    </div>
  );
}

export default App;
