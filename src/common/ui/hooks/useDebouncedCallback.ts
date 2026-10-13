import { useCallback, useEffect, useRef } from "react";
import { useLatest } from "./useLatest";

/**
 * Delays a callback until calls stop for `delayMs`. The latest callback is used when the timer
 * fires, and a pending call is dropped on unmount or `cancel`.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
) {
  const latest = useLatest(callback);
  const timer = useRef<number>(undefined);

  const cancel = useCallback(() => {
    window.clearTimeout(timer.current);
  }, []);

  const call = useCallback(
    (...args: Args) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => latest.current(...args), delayMs);
    },
    [delayMs, latest],
  );

  useEffect(() => cancel, [cancel]);

  return { call, cancel };
}
