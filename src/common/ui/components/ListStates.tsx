export interface EmptyStateCopy {
  title: string;
  body: string;
  create: string;
  noResultsTitle: string;
  noResultsBody: string;
  clearFilters: string;
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="state" role="status">
      <ul className="skeleton" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} />
        ))}
      </ul>
      <p className="state-line">
        <span className="spinner" aria-hidden="true" />
        {message}
      </p>
    </div>
  );
}

export function EmptyState({
  filtered,
  copy,
  onCreate,
  onClear,
}: {
  filtered: boolean;
  copy: EmptyStateCopy;
  onCreate: () => void;
  onClear: () => void;
}) {
  if (filtered) {
    return (
      <div className="state">
        <h2>{copy.noResultsTitle}</h2>
        <p className="muted">{copy.noResultsBody}</p>
        <button type="button" className="btn" onClick={onClear}>
          {copy.clearFilters}
        </button>
      </div>
    );
  }

  return (
    <div className="state">
      <h2>{copy.title}</h2>
      <p className="muted">{copy.body}</p>
      <button type="button" className="btn primary" onClick={onCreate}>
        {copy.create}
      </button>
    </div>
  );
}

export function ErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="state" role="alert">
      <h2>{title}</h2>
      <p className="muted">{message}</p>
      <button type="button" className="btn" onClick={onRetry}>
        {retryLabel}
      </button>
    </div>
  );
}
