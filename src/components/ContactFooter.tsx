import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Mail } from 'lucide-react';
import type { SiteConfig } from '../data/types';
import { copyText } from '../lib/clipboard';
import { navigateToSection } from '../lib/navigation';
import '../styles/sections.css';

export interface ContactFooterProps {
  site: SiteConfig;
}

function resolveExternalHref(value?: string): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed || trimmed === '#') {
    return null;
  }
  return trimmed;
}

export function ContactFooter({ site }: ContactFooterProps) {
  const [copyFeedback, setCopyFeedback] = useState<{
    key: 'primary' | 'forward';
    email: string;
    status: 'copied' | 'failed';
  } | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const handleCopyEmail = async (key: 'primary' | 'forward', email: string) => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    const ok = await copyText(email);
    setCopyFeedback({
      key,
      email,
      status: ok ? 'copied' : 'failed',
    });

    resetTimerRef.current = window.setTimeout(() => {
      setCopyFeedback(null);
      resetTimerRef.current = null;
    }, 2400);
  };

  const creatorHref = resolveExternalHref(site.creatorUrl);
  const repoHref = resolveExternalHref(site.repoUrl) ?? resolveExternalHref(site.githubUrl);
  const xHref = resolveExternalHref(site.xUrl);

  return (
    <footer id="contact" className="site-footer" aria-labelledby="contact-heading">
      <div className="container">
        <div className="section-header-block">
          <p className="section-eyebrow">CONTACT · OPERATOR HUB</p>
          <h2 id="contact-heading" className="section-heading">
            Reach the Hivework inbox or {site.creatorName} directly
          </h2>
          <p className="section-lead">
            Questions on new harness integrations, division contributions, or runbook workflows are
            routed straight to the maintainer.
          </p>
        </div>

        <div className="footer-contact-grid">
          <div className="hairline-card contact-card">
            <div>
              <p className="contact-card-eyebrow">PROJECT INBOX</p>
              <div className="contact-email-row">
                <a href={`mailto:${site.primaryEmail}`} className="contact-email-link">
                  {site.primaryEmail}
                </a>
                <button
                  type="button"
                  className="terminal-copy-btn"
                  onClick={() => handleCopyEmail('primary', site.primaryEmail)}
                  aria-label={`Copy ${site.primaryEmail}`}
                >
                  {copyFeedback?.key === 'primary' && copyFeedback.status === 'copied' ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                  <span>Copy</span>
                </button>
              </div>
              <p className="contact-note">Forwards to {site.forwardTargetEmail}</p>
            </div>

            <div className="contact-actions-row">
              <span className="pill-badge">
                <Mail size={12} aria-hidden="true" />
                <span>Harnesses · Divisions · Runbooks</span>
              </span>
            </div>
          </div>

          <div className="hairline-card contact-card">
            <div>
              <p className="contact-card-eyebrow">DIRECT MAINTAINER · {site.creatorName.toUpperCase()}</p>
              <div className="contact-email-row">
                <a href={`mailto:${site.forwardTargetEmail}`} className="contact-email-link">
                  {site.forwardTargetEmail}
                </a>
                <button
                  type="button"
                  className="terminal-copy-btn"
                  onClick={() => handleCopyEmail('forward', site.forwardTargetEmail)}
                  aria-label={`Copy ${site.forwardTargetEmail}`}
                >
                  {copyFeedback?.key === 'forward' && copyFeedback.status === 'copied' ? (
                    <Check size={14} aria-hidden="true" />
                  ) : (
                    <Copy size={14} aria-hidden="true" />
                  )}
                  <span>Copy</span>
                </button>
              </div>
              <p className="contact-note">Direct personal inbox &amp; creator homepage</p>
            </div>

            <div className="contact-actions-row">
              {creatorHref ? (
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

              {repoHref ? (
                <a
                  href={repoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  <span>GitHub</span>
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

              {xHref ? (
                <a
                  href={xHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                >
                  <span>X</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <p className="contact-copy-status" role="status" aria-live="polite">
          {copyFeedback
            ? copyFeedback.status === 'copied'
              ? `Copied ${copyFeedback.email}`
              : `Copy failed — select ${copyFeedback.email} manually`
            : ''}
        </p>

        <div className="footer-bottom-bar">
          <div className="footer-brand-meta">
            <img
              src="./logo-icon.svg"
              alt="Hivework"
              className="footer-mark"
              width={28}
              height={28}
            />
            <p className="footer-license-text">
              Hivework ({site.domain}) · Open-source MIT License
            </p>
          </div>

          <a
            href="/"
            className="site-nav-link"
            onClick={(e) => navigateToSection('hero', e)}
          >
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
