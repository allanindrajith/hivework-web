declare module '*/scripts/sync-catalog.mjs' {
  type CatalogData = import('./data/types').CatalogData;
  export function buildCatalog(repoRoot: string): CatalogData;
  export function syncCatalog(repoRoot?: string, options?: { withDesktop?: boolean }): CatalogData;
  export function syncDesktopApp(appDir: string): void;
  export function machoArchs(buf: Buffer): string[];
}

declare module '*/scripts/html-totals.mjs' {
  type CatalogTotals = import('./data/types').CatalogTotals;
  export function injectCatalogTotals(html: string, totals: CatalogTotals): string;
  export function catalogTotalsHtml(totals: CatalogTotals): {
    name: string;
    transformIndexHtml: (html: string) => string;
  };
}

declare module '*/scripts/verify-dist.mjs' {
  export function verifyDistHtml(html: string): void;
  export function verifyDist(distDir?: string): void;
}
