import { useEffect, useState } from "react";
import { useLatest } from "../../../common/ui/hooks/useLatest";
import { toAccountFailure } from "../../domain/mappers/AccountFailureMapper";
import type { AccountFailure } from "../../domain/models/AccountFailure";
import type { AccountFilters } from "../../domain/models/AccountFilters";
import type { AccountPage } from "../../domain/models/AccountPage";
import type { AccountApi } from "../../domain/services/AccountService";

interface ListState {
  loading: boolean;
  /** Last successfully loaded page, kept visible while the next request is in flight. */
  page?: AccountPage;
  failure?: AccountFailure;
}

/** Loads one list page, cancelling the previous request when the query changes. */
export function useAccountList(
  accounts: AccountApi,
  filters: AccountFilters,
  page: number,
  onUnauthenticated: () => void,
) {
  const [state, setState] = useState<ListState>({ loading: true });
  const [reloadKey, setReloadKey] = useState(0);
  const unauthenticated = useLatest(onUnauthenticated);
  const { text, role, status } = filters;

  useEffect(() => {
    const controller = new AbortController();

    setState((current) => ({
      loading: true,
      page: current.failure ? undefined : current.page,
    }));

    accounts
      .list({ text, role, status }, page, controller.signal)
      .then((loaded) => {
        if (!controller.signal.aborted) {
          setState({ loading: false, page: loaded });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        const failure = toAccountFailure(error);

        setState({ loading: false, failure });

        if (failure.kind === "unauthenticated") {
          unauthenticated.current();
        }
      });

    return () => controller.abort();
  }, [accounts, text, role, status, page, reloadKey, unauthenticated]);

  return { ...state, reload: () => setReloadKey((key) => key + 1) };
}
