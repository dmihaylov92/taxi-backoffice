import { accountsCopy } from "../assets/copy";

interface PaginationProps {
  /** Zero-based. */
  page: number;
  shown: number;
  hasNext: boolean;
  disabled: boolean;
  onPage: (page: number) => void;
}

/** Previous/next only: the API exposes no totals, so numbered pages would be invented. */
export function Pagination({
  page,
  shown,
  hasNext,
  disabled,
  onPage,
}: PaginationProps) {
  return (
    <nav className="pagination" aria-label={accountsCopy.pageLabel}>
      <p className="muted" role="status">
        {accountsCopy.shown(shown)}
      </p>
      <div className="pagination-controls">
        <button
          type="button"
          className="btn"
          disabled={disabled || page === 0}
          onClick={() => onPage(page - 1)}
        >
          {accountsCopy.previous}
        </button>
        <span aria-current="page" className="page-number">
          {accountsCopy.currentPage(page + 1)}
        </span>
        <button
          type="button"
          className="btn"
          disabled={disabled || !hasNext}
          onClick={() => onPage(page + 1)}
        >
          {accountsCopy.next}
        </button>
      </div>
    </nav>
  );
}
