export interface PaginationCopy {
  label: string;
  shown: (count: number) => string;
  previous: string;
  next: string;
  currentPage: (page: number) => string;
}

interface PaginationProps {
  /** Zero-based. */
  page: number;
  shown: number;
  hasNext: boolean;
  disabled: boolean;
  copy: PaginationCopy;
  onPage: (page: number) => void;
}

/** Previous/next only: the API exposes no totals, so numbered pages would be invented. */
export function Pagination({
  page,
  shown,
  hasNext,
  disabled,
  copy,
  onPage,
}: PaginationProps) {
  return (
    <nav className="pagination" aria-label={copy.label}>
      <p className="muted" role="status">
        {copy.shown(shown)}
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn"
          disabled={disabled || page === 0}
          onClick={() => onPage(page - 1)}
        >
          {copy.previous}
        </button>
        <span aria-current="page" className="page-number">
          {copy.currentPage(page + 1)}
        </span>
        <button
          type="button"
          className="btn"
          disabled={disabled || !hasNext}
          onClick={() => onPage(page + 1)}
        >
          {copy.next}
        </button>
      </div>
    </nav>
  );
}
