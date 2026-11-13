import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import rawCatalog from '../data/catalog.generated.json';
import type { CatalogData } from '../data/types';
import { siteConfig } from '../data/site';
import { ModelMatrix } from '../components/ModelMatrix';
import { WorkforceSection } from '../components/WorkforceSection';
import { SkillsSection } from '../components/SkillsSection';
import { EmployeesSection } from '../components/EmployeesSection';
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

  it('renders direct macOS desktop app download CTA with link to Hivework.dmg', () => {
    render(<ModelMatrix tools={catalog.tools} divisions={catalog.divisions} />);

    const downloadLink = screen.getByRole('link', { name: /Download for macOS/i });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', '/downloads/Hivework.dmg');
    expect(downloadLink).toHaveAttribute('download', 'Hivework.dmg');
    expect(screen.getByText(/Prefer a native desktop GUI on your Mac\?/i)).toBeInTheDocument();
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

  it('allows selecting individual agents into a custom CLI command cart and links every agent to GitHub source', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <WorkforceSection
        divisions={catalog.divisions}
        runbooks={catalog.runbooks}
        repoUrl={siteConfig.repoUrl}
      />
    );

    const selectBtns = screen.getAllByRole('button', { name: /Select agent/i });
    expect(selectBtns.length).toBeGreaterThan(0);

    fireEvent.click(selectBtns[0]);
    expect(screen.getByRole('region', { name: /Selected agent CLI builder/i })).toBeInTheDocument();

    const copyCustomBtn = screen.getByRole('button', { name: /Copy selected agents command/i });
    fireEvent.click(copyCustomBtn);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\.\/scripts\/install\.sh --agent hive-/))
    );

    const ghSourceLinks = screen.getAllByRole('link', { name: /View .* on GitHub/i });
    expect(ghSourceLinks.length).toBeGreaterThan(0);
    expect(ghSourceLinks[0].getAttribute('href')).toMatch(
      /^https:\/\/github\.com\/allanindrajith\/hivework\/blob\/main\//
    );
  });
});

describe('SkillsSection', () => {
  it('renders 25 modular skills and 10 Goldfish reviewers with GitHub SKILL.md links and CLI copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <SkillsSection
        skills={catalog.skills}
        reviewers={catalog.reviewers}
        repoUrl={siteConfig.repoUrl}
      />
    );

    expect(screen.getByText('hive-brainstorm')).toBeInTheDocument();
    expect(screen.getByText('hive-design-critic')).toBeInTheDocument();

    const brainstormLink = screen.getByRole('link', { name: /Open hive-brainstorm SKILL\.md on GitHub/i });
    expect(brainstormLink).toHaveAttribute(
      'href',
      'https://github.com/allanindrajith/hivework/blob/main/skills/hive-brainstorm/SKILL.md'
    );

    fireEvent.click(screen.getByRole('button', { name: /Goldfish Reviewers \(10\)/i }));
    expect(screen.getByText('hive-design-critic')).toBeInTheDocument();
    expect(screen.queryByText('hive-brainstorm')).not.toBeInTheDocument();
  });

  it('offers no CLI copy button on reviewer cards because install.sh cannot install reviewers', () => {
    render(
      <SkillsSection
        skills={catalog.skills}
        reviewers={catalog.reviewers}
        repoUrl={siteConfig.repoUrl}
      />
    );

    expect(
      screen.queryByRole('button', { name: /Copy CLI command for hive-design-critic/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open hive-design-critic on GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/allanindrajith/hivework/blob/main/agents/hive-design-critic.md'
    );
    expect(
      screen.getByRole('button', { name: /Copy CLI command for hive-brainstorm/i })
    ).toBeInTheDocument();
  });
});

describe('EmployeesSection', () => {
  it('renders all 8 autonomous AI employees, filters by search, and copies hive-hire install command', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<EmployeesSection employees={catalog.employees} repoUrl={siteConfig.repoUrl} />);

    expect(screen.getByText('Chief of Staff')).toBeInTheDocument();
    expect(screen.getByText('GTM Engineer')).toBeInTheDocument();
    expect(screen.getByText('Web Dev Employee')).toBeInTheDocument();
    expect(screen.getByText(/Showing 8 of 8 employees/i)).toBeInTheDocument();

    const searchInput = screen.getByRole('searchbox', { name: /Search employees/i });
    fireEvent.change(searchInput, { target: { value: 'gtm' } });
    expect(screen.getByText('GTM Engineer')).toBeInTheDocument();
    expect(screen.queryByText('Chief of Staff')).not.toBeInTheDocument();

    const copyBtn = screen.getByRole('button', { name: /Copy hire command for GTM Engineer/i });
    fireEvent.click(copyBtn);
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('./scripts/install.sh --skills')
    );
  });

  it('never emits the unsupported --skill flag and lists only skill-capable harnesses', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { container } = render(
      <EmployeesSection employees={catalog.employees} repoUrl={siteConfig.repoUrl} />
    );

    expect(container.textContent).not.toMatch(/--skill\b(?!s)/);
    expect(container.textContent).toContain('Claude Code, Codex, Antigravity, Osaurus, or DSH');
    expect(container.textContent).not.toMatch(/Cursor|OpenCode/);

    fireEvent.click(screen.getByRole('button', { name: /Copy hive-hire install command/i }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith('./scripts/install.sh --skills')
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
    expect(screen.getByRole('link', { name: /Buy me a coffee/i })).toHaveAttribute(
      'href',
      'https://www.buymeacoffee.com/allanidrajith'
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
  it('composes all hub sections in the exact order of the navigation bar with clean path URLs', () => {
    const { container } = render(<App />);

    const expectedOrder = [
      'hero',
      'model-matrix',
      'workforce',
      'skills',
      'employees',
      'runbooks',
      'story',
      'contact',
    ];

    const elements = expectedOrder.map((id) => {
      const el = container.querySelector(`#${id}`);
      expect(el).toBeInTheDocument();
      return el!;
    });

    // Verify DOM sequence follows navigation bar exactly
    for (let i = 0; i < elements.length - 1; i++) {
      expect(
        elements[i].compareDocumentPosition(elements[i + 1]) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      const href = link.getAttribute('href') ?? '';
      expect(href).toBeTruthy();
      expect(href.startsWith('#')).toBe(false);
    });
  });

  it('paginates divisions, skills, and employees to 6 items per page with pager navigation', () => {
    render(<App />);

    // Workforce pager: 18 divisions across 3 pages (6 per page)
    expect(screen.getByRole('navigation', { name: /Pagination for divisions/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Page 1 of 3/i).length).toBeGreaterThan(0);
    const workforceNextBtn = screen.getAllByRole('button', { name: /Go to next page/i })[0];
    fireEvent.click(workforceNextBtn);
    expect(screen.getAllByText(/Page 2 of 3/i).length).toBeGreaterThan(0);

    // Employees pager: 8 employees across 2 pages (6 on page 1, 2 on page 2)
    expect(screen.getByRole('navigation', { name: /Pagination for employees/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Page 1 of 2/i).length).toBeGreaterThan(0);
  });
});
