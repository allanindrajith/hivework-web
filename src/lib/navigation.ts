import type React from 'react';

export type SectionId =
  | 'hero'
  | 'model-matrix'
  | 'workforce'
  | 'skills'
  | 'runbooks'
  | 'story'
  | 'contact';

export interface SectionRoute {
  id: SectionId;
  path: string;
  label: string;
}

export const SECTION_ROUTES: readonly SectionRoute[] = [
  { id: 'hero', path: '/', label: 'Overview' },
  { id: 'model-matrix', path: '/harnesses', label: 'Harnesses' },
  { id: 'workforce', path: '/agents', label: 'Agents' },
  { id: 'skills', path: '/skills', label: 'Skills' },
  { id: 'runbooks', path: '/runbooks', label: 'Runbooks' },
  { id: 'story', path: '/architecture', label: 'Architecture' },
  { id: 'contact', path: '/contact', label: 'Contact' },
] as const;

export function getSectionPath(sectionId: SectionId): string {
  const match = SECTION_ROUTES.find((r) => r.id === sectionId);
  return match ? match.path : '/';
}

export function resolveSectionFromPath(pathname: string, hash = ''): SectionId {
  const cleanHash = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (cleanHash) {
    const byHashId = SECTION_ROUTES.find(
      (r) => r.id === cleanHash || r.path.slice(1) === cleanHash
    );
    if (byHashId) {
      return byHashId.id;
    }
  }

  const normalized = pathname.replace(/\/+$/, '') || '/';
  const direct = SECTION_ROUTES.find((r) => r.path === normalized);
  if (direct) {
    return direct.id;
  }

  // Support legacy or subfolder paths if trailing segment matches
  const lastSegment = normalized.split('/').filter(Boolean).pop() ?? '';
  const bySegment = SECTION_ROUTES.find(
    (r) => r.path === `/${lastSegment}` || r.id === lastSegment
  );
  return bySegment ? bySegment.id : 'hero';
}

export function navigateToSection(
  sectionId: SectionId,
  event?: React.MouseEvent<HTMLElement>
): void {
  if (event) {
    event.preventDefault();
  }

  const nextPath = getSectionPath(sectionId);
  if (typeof window !== 'undefined' && window.history?.pushState) {
    try {
      window.history.pushState({ sectionId }, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      // Ignore history security errors in sandboxed/file origins
    }
  }

  if (typeof document !== 'undefined') {
    if (sectionId === 'hero') {
      window.scrollTo?.({ top: 0, behavior: 'smooth' });
      return;
    }
    const targetEl = document.getElementById(sectionId);
    if (targetEl && typeof targetEl.scrollIntoView === 'function') {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
