import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import catalog from '../data/catalog.generated.json';
import { siteConfig } from '../data/site';
import { HeaderNav } from '../components/HeaderNav';
import { HeroSection } from '../components/HeroSection';
import { StorySection } from '../components/StorySection';

describe('HeaderNav, HeroSection, and StorySection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders verified catalog numbers and never renders empty repo anchor links', () => {
    render(
      <>
        <HeaderNav site={{ ...siteConfig, repoUrl: '', githubUrl: '' }} />
        <HeroSection totals={catalog.totals} site={{ ...siteConfig, repoUrl: '', githubUrl: '' }} />
      </>
    );
    expect(screen.getByText('296')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('21')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /itsallan\.me/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Buy me a coffee/i })).toHaveAttribute(
      'href',
      'https://www.buymeacoffee.com/allanidrajith'
    );
    expect(screen.queryByRole('link', { name: /GitHub/i })).not.toBeInTheDocument();

    const links = screen.getAllByRole('link');
    links.forEach((a) => {
      const href = a.getAttribute('href') ?? '';
      expect(href).not.toBe('');
      expect(href.startsWith('#')).toBe(false);
    });
  });

  it('uses clean path URLs in HeaderNav (/harnesses, /agents, /skills, /runbooks, /architecture, /contact) and updates window.location.pathname on click', () => {
    render(<HeaderNav site={siteConfig} />);

    const harnessesLink = screen.getByRole('link', { name: /^Harnesses$/i });
    const agentsLink = screen.getByRole('link', { name: /^Agents$/i });
    const skillsLink = screen.getByRole('link', { name: /^Skills$/i });
    const runbooksLink = screen.getByRole('link', { name: /^Runbooks$/i });

    expect(harnessesLink).toHaveAttribute('href', '/harnesses');
    expect(agentsLink).toHaveAttribute('href', '/agents');
    expect(skillsLink).toHaveAttribute('href', '/skills');
    expect(runbooksLink).toHaveAttribute('href', '/runbooks');

    fireEvent.click(skillsLink);
    expect(window.location.pathname).toBe('/skills');
    expect(window.location.hash).toBe('');
  });

  it('renders conditional repository link only when repoUrl or githubUrl is provided', () => {
    const repoUrl = 'https://github.com/example/hivework';
    render(
      <>
        <HeaderNav site={{ ...siteConfig, repoUrl }} />
        <HeroSection totals={catalog.totals} site={{ ...siteConfig, repoUrl }} />
      </>
    );

    const headerRepoLink = screen.getByRole('link', { name: /^GitHub$/i });
    expect(headerRepoLink).toHaveAttribute('href', repoUrl);
    expect(headerRepoLink).toHaveAttribute('rel', 'noopener noreferrer');

    const heroRepoLink = screen.getByRole('link', { name: /Source Repository/i });
    expect(heroRepoLink).toHaveAttribute('href', repoUrl);
  });

  it('switches hero quick-start terminal tabs and shows copy confirmation', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<HeroSection totals={catalog.totals} site={siteConfig} />);

    expect(screen.getByRole('region', { name: /Quick-start CLI commands/i })).toBeInTheDocument();

    const installAllBtn = screen.getByRole('button', { name: /Install All/i });
    const installSkillsBtn = screen.getByRole('button', { name: /Install Skills/i });
    const convertAllBtn = screen.getByRole('button', { name: /Convert All/i });

    expect(installAllBtn).toHaveAttribute('aria-pressed', 'true');
    expect(installSkillsBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(installSkillsBtn);
    expect(installSkillsBtn).toHaveAttribute('aria-pressed', 'true');
    expect(installAllBtn).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/--skills/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Copy command/i }));
    await waitFor(() => expect(screen.getByText(/Copied/i)).toBeInTheDocument());

    fireEvent.click(convertAllBtn);
    expect(convertAllBtn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/convert\.sh --parallel/)).toBeInTheDocument();
    expect(screen.queryByText(/Copied/i)).not.toBeInTheDocument();
  });

  it('surfaces an accessible fallback message when clipboard copy fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
    });
    document.execCommand = vi.fn().mockReturnValue(false);

    render(<HeroSection totals={catalog.totals} site={siteConfig} />);
    fireEvent.click(screen.getByRole('button', { name: /Copy command/i }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Copy failed/i));
  });

  it('displays origin story and Allan creator card with itsallan.me and hello@itsallan.me', () => {
    render(<StorySection totals={catalog.totals} site={siteConfig} />);
    expect(screen.getByText(/01\. Single-Prompt Drift/i)).toBeInTheDocument();
    expect(screen.getByText(/02\. Canonical Markdown \+ Goldfish Review/i)).toBeInTheDocument();
    expect(screen.getByText(/03\. Native Compilation via/i)).toBeInTheDocument();
    // Anchored regex prevents matching "hello@itsallan.me", which also contains "itsallan.me"
    expect(screen.getByRole('link', { name: /^itsallan\.me$/i })).toHaveAttribute('href', 'https://itsallan.me');
    expect(screen.getByRole('link', { name: /Buy me a coffee/i })).toHaveAttribute(
      'href',
      'https://www.buymeacoffee.com/allanidrajith'
    );
    expect(screen.getByRole('link', { name: /^hello@itsallan\.me$/i })).toHaveAttribute(
      'href',
      'mailto:hello@itsallan.me'
    );
  });

  it('omits creator website link in StorySection when creatorUrl is empty or "#"', () => {
    const { rerender } = render(
      <StorySection totals={catalog.totals} site={{ ...siteConfig, creatorUrl: '' }} />
    );

    expect(screen.queryByRole('link', { name: /^itsallan\.me$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^hello@itsallan\.me$/i })).toHaveAttribute(
      'href',
      'mailto:hello@itsallan.me'
    );

    rerender(<StorySection totals={catalog.totals} site={{ ...siteConfig, creatorUrl: '  #  ' }} />);
    expect(screen.queryByRole('link', { name: /^itsallan\.me$/i })).not.toBeInTheDocument();
    screen.getAllByRole('link').forEach((a) => {
      expect(a.getAttribute('href')).not.toBe('');
      expect(a.getAttribute('href')).not.toBe('#');
    });
  });
});
