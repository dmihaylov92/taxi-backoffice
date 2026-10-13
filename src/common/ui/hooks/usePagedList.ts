import { useEffect, useState } from "react";
import { toApiFailure } from "../../domain/mappers/ApiFailureMapper";
import type { ApiFailure } from "../../domain/models/ApiFailure";
import type { ListPage } from "../../domain/models/ListPage";
import { useLatest } from "./useLatest";

interface PagedListApi<Filters, Item> {
  list(
    filters: Filters,
    page: number,
    signal?: AbortSignal,
  ): Promise<ListPage<Item>>;
}

interface ListState<Item> {
  loading: boolean;
  /** Last successfully loaded page, kept visible while the next request is in flight. */
  page?: ListPage<Item>;
  failure?: ApiFailure;
}

/**
 * Loads one list page, cancelling the previous request when the query changes. `filters` must be
 * referentially stable between renders with the same values (for example memoized). A page past the
 * end (after a removal, or a result that is an exact multiple of the page size) reports the page before
 * it through `onEmptyPage` and stays in the loading state.
 */
export function usePagedList<Filters, Item>(
  api: PagedListApi<Filters, Item>,
  filters: Filters,
  page: number,
  onUnauthenticated: () => void,
  onEmptyPage: (previousPage: number) => void,
) {
  const [state, setState] = useState<ListState<Item>>({ loading: true });
  const [reloadKey, setReloadKey] = useState(0);
  const unauthenticated = useLatest(onUnauthenticated);
  const emptyPage = useLatest(onEmptyPage);

  useEffect(() => {
    const controller = new AbortController();

    setState((current) => ({
      loading: true,
      page: current.failure ? undefined : current.page,
    }));

    api
      .list(filters, page, controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) {
          return;
        }

        if (loaded.items.length === 0 && page > 0) {
          emptyPage.current(page - 1);

          return;
        }

        setState({ loading: false, page: loaded });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        const failure = toApiFailure(error);

        setState({ loading: false, failure });

        if (failure.kind === "unauthenticated") {
          unauthenticated.current();
        }
      });

    return () => controller.abort();
  }, [api, filters, page, reloadKey, unauthenticated, emptyPage]);

  return { ...state, reload: () => setReloadKey((key) => key + 1) };
}
