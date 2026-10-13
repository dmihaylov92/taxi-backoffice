import { useEffect } from "react";
import { useAsyncAction } from "../../../common/ui/hooks/useAsyncAction";
import { useLatest } from "../../../common/ui/hooks/useLatest";
import { toAccountFailure } from "../../domain/mappers/AccountFailureMapper";

/**
 * Account mutation state: pending, mapped failure and a single in-flight guard. A rejected session
 * is reported once through `onUnauthenticated` so every caller handles expiry the same way.
 */
export function useAccountAction(onUnauthenticated: () => void) {
  const action = useAsyncAction(toAccountFailure);
  const expired = useLatest(onUnauthenticated);
  const kind = action.failure?.kind;

  useEffect(() => {
    if (kind === "unauthenticated") {
      expired.current();
    }
  }, [kind, expired]);

  return action;
}
