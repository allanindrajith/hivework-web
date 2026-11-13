// Fills %HW_*% tokens in index.html with catalog totals at build/dev time,
// so the <title> and social meta tags never drift from src/data/catalog.generated.json.

const TOKENS = {
  HW_AGENTS: 'agents',
  HW_DIVISIONS: 'divisions',
  HW_TOOLS: 'tools',
  HW_SKILLS: 'skills',
  HW_EMPLOYEES: 'employees',
};

export function injectCatalogTotals(html, totals) {
  return html.replace(/%(HW_[A-Z_]+)%/g, (match, token) => {
    const key = TOKENS[token];
    const value = key ? totals?.[key] : undefined;
    if (typeof value !== 'number') {
      throw new Error(`index.html token ${match} has no numeric catalog total`);
    }
    return String(value);
  });
}

/** Vite plugin wrapper. */
export function catalogTotalsHtml(totals) {
  return {
    name: 'hivework-catalog-totals-html',
    transformIndexHtml: (html) => injectCatalogTotals(html, totals),
  };
}
