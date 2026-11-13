import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import catalog from '../data/catalog.generated.json';
import { injectCatalogTotals } from '../../scripts/html-totals.mjs';
import { verifyDistHtml } from '../../scripts/verify-dist.mjs';

const indexHtml = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');

describe('index.html catalog counts', () => {
  it('uses tokens instead of hardcoded counts', () => {
    expect(indexHtml).toContain('%HW_AGENTS%');
    expect(indexHtml).not.toMatch(new RegExp(`\\b${catalog.totals.agents}\\b`));
  });

  it('fills every token from the catalog totals', () => {
    const html = injectCatalogTotals(indexHtml, catalog.totals);
    expect(html).not.toContain('%HW_');
    expect(html).toContain(
      `<title>Hivework — ${catalog.totals.agents} Autonomous AI Agents across ${catalog.totals.divisions} Divisions & ${catalog.totals.employees} AI Employees</title>`
    );
    expect(html).toContain(`${catalog.totals.skills} modular skills`);
    expect(html).toContain(`${catalog.totals.tools} AI developer harnesses`);
  });

  it('verify-dist rejects a build that still contains tokens', () => {
    expect(() => verifyDistHtml('<title>%HW_AGENTS% agents</title>')).toThrow(/HW_AGENTS/);
    expect(() => verifyDistHtml(injectCatalogTotals(indexHtml, catalog.totals))).not.toThrow();
  });

  it('fails loudly on an unknown token', () => {
    expect(() => injectCatalogTotals('%HW_NOPE%', catalog.totals)).toThrow(/HW_NOPE/);
  });
});
