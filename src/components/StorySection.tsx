import { ExternalLink, Mail } from 'lucide-react';
import type { CatalogTotals, SiteConfig } from '../data/types';
import '../styles/landing.css';

export interface StorySectionProps {
  totals: CatalogTotals;
  site: SiteConfig;
}

export function StorySection({ totals, site }: StorySectionProps) {
  const creatorHref = (site.creatorUrl ?? '').trim();

  return (
    <section id="story" className="story-section" aria-labelledby="story-heading">
      <div className="container">
        <div className="story-header">
          <p className="section-eyebrow">ORIGIN STORY · ARCHITECTURE</p>
          <h2 id="story-heading" className="section-heading">
            Why one canonical swarm beats monolithic prompts
          </h2>
          <p className="section-lead">
            Hivework keeps agent personas, skills, and context-isolated reviewers in plain Markdown
            so your workflow travels cleanly across every AI developer harness on your machine.
          </p>
        </div>

        <ol className="grid-responsive story-grid">
          <li className="hairline-card story-step-card">
            <span className="story-step-index">01. Single-Prompt Drift</span>
            <h3 className="story-step-title">Monolithic system prompts collapse across domains</h3>
            <p className="story-step-body">
              Asking one catch-all prompt to architect APIs, audit security boundaries, tune CSS,
              and write QA checks dilutes constraints as context grows. Specialized roles prevent
              silent trade-offs.
            </p>
          </li>

          <li className="hairline-card story-step-card">
            <span className="story-step-index">02. Canonical Markdown + Goldfish Review</span>
            <h3 className="story-step-title">Versioned personas plus zero-bias review</h3>
            <p className="story-step-body">
              {totals.agents} focused personas across {totals.divisions} divisions and{' '}
              {totals.skills} modular skills pair with {totals.reviewers} context-isolated Goldfish
              reviewers in <code className="inline-code">agents/</code> so every check starts fresh
              without author bias.
            </p>
          </li>

          <li className="hairline-card story-step-card">
            <span className="story-step-index">
              03. Native Compilation via <code className="inline-code">convert.sh</code>
            </span>
            <h3 className="story-step-title">Write once, compile for {totals.tools} tools</h3>
            <p className="story-step-body">
              <code className="inline-code">./scripts/convert.sh</code> and{' '}
              <code className="inline-code">./scripts/install.sh</code> translate canonical Markdown
              into native agent, rule, TOML, <code className="inline-code">SKILL.md</code>,{' '}
              <code className="inline-code">CONVENTIONS.md</code>, and router plugin artifacts.
            </p>
          </li>
        </ol>

        <aside className="hairline-card creator-card" aria-label="Creator attribution">
          <div className="creator-card-info">
            <p className="creator-card-eyebrow">BUILT BY {site.creatorName.toUpperCase()}</p>
            <h3 className="creator-card-title">
              Maintained by {site.creatorName}
            </h3>
            <p className="creator-card-text">
              Hivework is designed and curated as an open, portable operator toolkit—connecting your
              local terminal workflows back to {site.creatorName}&apos;s home on the web.
            </p>
          </div>

          <div className="creator-card-links">
            {creatorHref.length > 0 && creatorHref !== '#' ? (
              <a
                href={creatorHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline"
              >
                <span>itsallan.me</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}

            {site.buyMeACoffeeUrl ? (
              <a
                href={site.buyMeACoffeeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline bmc-button"
              >
                <span aria-hidden="true">☕</span>
                <span>Buy me a coffee</span>
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            ) : null}

            <a
              href={`mailto:${site.forwardTargetEmail}`}
              className="btn-primary"
            >
              <Mail size={14} aria-hidden="true" />
              <span>{site.forwardTargetEmail}</span>
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
