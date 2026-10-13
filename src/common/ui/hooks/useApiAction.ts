import { useEffect } from "react";
import { toApiFailure } from "../../domain/mappers/ApiFailureMapper";
import { useAsyncAction } from "./useAsyncAction";
import { useLatest } from "./useLatest";

/**
 * API mutation state: pending, mapped failure and a single in-flight guard. A rejected session
 * is reported once through `onUnauthenticated` so every caller handles expiry the same way.
 */
export function useApiAction(onUnauthenticated: () => void) {
  const action = useAsyncAction(toApiFailure);
  const expired = useLatest(onUnauthenticated);
  const kind = action.failure?.kind;

  useEffect(() => {
    if (kind === "unauthenticated") {
      expired.current();
    }
  }, [kind, expired]);

  return action;
}
