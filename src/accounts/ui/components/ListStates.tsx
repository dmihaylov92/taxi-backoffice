import { accountsCopy } from "../assets/copy";

export function LoadingState() {
  return (
    <div className="state" role="status">
      <ul className="skeleton" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} />
        ))}
      </ul>
      <p className="state-line">
        <span className="spinner" aria-hidden="true" />
        {accountsCopy.loading}
      </p>
    </div>
  );
}

export function EmptyState({
  filtered,
  onCreate,
  onClear,
}: {
  filtered: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  if (filtered) {
    return (
      <div className="state">
        <h2>{accountsCopy.noResultsTitle}</h2>
        <p className="muted">{accountsCopy.noResultsBody}</p>
        <button type="button" className="btn" onClick={onClear}>
          {accountsCopy.clearFilters}
        </button>
      </div>
    );
  }

  return (
    <div className="state">
      <h2>{accountsCopy.emptyTitle}</h2>
      <p className="muted">{accountsCopy.emptyBody}</p>
      <button type="button" className="btn primary" onClick={onCreate}>
        {accountsCopy.newAccount}
      </button>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="state" role="alert">
      <h2>{accountsCopy.errorTitle}</h2>
      <p className="muted">{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        {accountsCopy.retry}
      </button>
    </div>
  );
}
