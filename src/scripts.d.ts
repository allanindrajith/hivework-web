declare module '*/scripts/sync-catalog.mjs' {
  type CatalogData = import('./data/types').CatalogData;
  export function buildCatalog(repoRoot: string): CatalogData;
  export function syncCatalog(repoRoot?: string): CatalogData;
}

declare module '*/scripts/verify-dist.mjs' {
  export function verifyDistHtml(html: string): void;
  export function verifyDist(distDir?: string): void;
}
