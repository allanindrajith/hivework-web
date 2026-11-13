import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/sections.css';

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  sectionId?: string;
}

export function PaginationBar({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  itemLabel = 'items',
  onPageChange,
  sectionId,
}: PaginationBarProps) {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);

    if (sectionId && typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <nav
      className="pagination-bar"
      role="navigation"
      aria-label={`Pagination for ${itemLabel}`}
    >
      <div className="pagination-count-wrap">
        <span className="pagination-count-text">
          Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalItems}</strong> {itemLabel}
        </span>
        <span className="pagination-page-indicator">
          Page {currentPage} of {totalPages}
        </span>
      </div>

      <div className="pagination-controls" role="group" aria-label="Page controls">
        <button
          type="button"
          className="pagination-nav-btn"
          disabled={currentPage === 1}
          onClick={() => handlePageClick(currentPage - 1)}
          aria-label="Go to previous page"
        >
          <ChevronLeft size={14} aria-hidden="true" />
          <span>Previous</span>
        </button>

        <div className="pagination-pages-list">
          {pages.map((p) => {
            const isCurrent = p === currentPage;
            return (
              <button
                key={p}
                type="button"
                className={`pagination-page-btn ${isCurrent ? 'pagination-page-btn-active' : ''}`}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Page ${p}`}
                onClick={() => handlePageClick(p)}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="pagination-nav-btn"
          disabled={currentPage === totalPages}
          onClick={() => handlePageClick(currentPage + 1)}
          aria-label="Go to next page"
        >
          <span>Next</span>
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
