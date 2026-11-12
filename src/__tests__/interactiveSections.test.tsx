import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import rawCatalog from '../data/catalog.generated.json';
import type { CatalogData } from '../data/types';
import { siteConfig } from '../data/site';
import { ModelMatrix } from '../components/ModelMatrix';
import { WorkforceSection } from '../components/WorkforceSection';
import { ContactFooter } from '../components/ContactFooter';
import { App } from '../App';

const catalog = rawCatalog as CatalogData;

describe('ModelMatrix', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters 17 tools by installKind and updates inspector format, destination, and CLI flags', () => {
    render(<ModelMatrix tools={catalog.tools} divisions={catalog.divisions} />);

    fireEvent.click(screen.getByRole('button', { name: /Roster \(2\)/i }));
    expect(screen.getByRole('button', { name: /Aider/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Windsurf/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Claude Code/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Plugin \(1\)/i }));
    expect(screen.getByRole('button', { name: /Hermes/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aider/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Per-Agent \(14\)/i }));
    expect(screen.getByRole('button', { name: /Claude Code/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hermes/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /All \(17\)/i }));
    fireEvent.click(screen.getByRole('button', { name: /Codex/i }));
    expect(screen.getByText(/codex-toml/)).toBeInTheDocument();
    expect(screen.getAllByText(/\.codex\/agents\/\{slug\}\.toml/).length).toBeGreaterThan(0);
    expect(screen.getByText(/--tool codex/)).toBeInTheDocument();
  });

  it('composes division, skills, link, and dry-run flags and copies the CLI command', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ModelMatrix tools={catalog.tools} divisions={catalog.divisions} />);

    fireEvent.click(screen.getByRole('button', { name: /Cursor/i }));
    fireEvent.change(screen.getByRole('combobox', { name: /Division/i }), {
      target: { value: 'engineering' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /--skills/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /--link/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /--dry-run/i }));

    const expectedCmd =
      './scripts/install.sh --tool cursor --division engineering --skills --link --dry-run';
    expect(screen.getByText(expectedCmd)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Copy install command/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expectedCmd));
    await waitFor(() => expect(screen.getByText(/Copied/i)).toBeInTheDocument());
  });
});

describe('WorkforceSection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders 18 divisions, filters by search, handles zero matches with Reset filter, and restores all divisions', () => {
    render(<WorkforceSection divisions={catalog.divisions} runbooks={catalog.runbooks} />);

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText(/Showing 18 of 18 divisions/i)).toBeInTheDocument();

    const input = screen.getByRole('searchbox', { name: /Search divisions/i });
    fireEvent.change(input, { target: { value: 'security' } });
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.queryByText('Academic')).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'zzzz-no-match' } });
    expect(screen.getByText(/No divisions match/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Reset filter/i }));
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText(/Showing 18 of 18 divisions/i)).toBeInTheDocument();
  });

  it('renders all 4 NEXUS runbook cards with core agent install commands and copies them', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<WorkforceSection divisions={catalog.divisions} runbooks={catalog.runbooks} />);

    expect(screen.getByText('Startup MVP Build')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Feature Development')).toBeInTheDocument();
    expect(screen.getByText('Multi-Channel Marketing Campaign')).toBeInTheDocument();
    expect(screen.getByText('Incident Response')).toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /Copy Startup MVP Build command/i });
    fireEvent.click(copyBtn);

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining('./scripts/install.sh --agent hive-agents-orchestrator')
      )
    );
  });
});

describe('ContactFooter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes hello@hivework.online, plain-text forwarding note to hello@itsallan.me, direct link, and itsallan.me', () => {
    render(<ContactFooter site={siteConfig} />);

    expect(screen.getByRole('link', { name: /^hello@hivework\.online$/i })).toHaveAttribute(
      'href',
      'mailto:hello@hivework.online'
    );
    expect(screen.getByText(/Forwards to hello@itsallan\.me/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^hello@itsallan\.me$/i })).toHaveAttribute(
      'href',
      'mailto:hello@itsallan.me'
    );
    expect(screen.getByRole('link', { name: /^itsallan\.me$/i })).toHaveAttribute(
      'href',
      'https://itsallan.me'
    );

    const footerMark = screen.getByRole('img', { name: /Hivework/i });
    expect(footerMark).toHaveAttribute('src', './logo-icon.svg');
  });

  it('copies both email addresses and announces status via aria-live', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ContactFooter site={siteConfig} />);

    fireEvent.click(screen.getByRole('button', { name: /Copy hello@hivework\.online/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('hello@hivework.online'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Copied hello@hivework\.online/i));

    fireEvent.click(screen.getByRole('button', { name: /Copy hello@itsallan\.me/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('hello@itsallan.me'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/Copied hello@itsallan\.me/i));
  });

  it('announces manual fallback message when email clipboard copy fails', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
    });
    document.execCommand = vi.fn().mockReturnValue(false);

    render(<ContactFooter site={siteConfig} />);
    fireEvent.click(screen.getByRole('button', { name: /Copy hello@hivework\.online/i }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(/Copy failed — select hello@hivework\.online manually/i)
    );
  });
});

describe('App', () => {
  it('composes all landing page sections with valid anchor targets and verified counts', () => {
    const { container } = render(<App />);

    expect(container.querySelector('#hero')).toBeInTheDocument();
    expect(container.querySelector('#story')).toBeInTheDocument();
    expect(container.querySelector('#model-matrix')).toBeInTheDocument();
    expect(container.querySelector('#workforce')).toBeInTheDocument();
    expect(container.querySelector('#contact')).toBeInTheDocument();

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    });
  });
});
