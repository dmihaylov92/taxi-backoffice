import { useEffect, useRef, useState } from "react";
import { useLatest } from "./useLatest";

/**
 * Runs one asynchronous mutation at a time and exposes its pending and failure state.
 * `run` resolves true only when the task completed, so callers claim success only then.
 * Failures are translated by `mapFailure`, which keeps slice-specific wording out of the hook.
 */
export function useAsyncAction<Failure>(
  mapFailure: (error: unknown) => Failure,
) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  const mapper = useLatest(mapFailure);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  async function run(task: () => Promise<void>): Promise<boolean> {
    if (busy.current) {
      return false;
    }

    busy.current = true;
    setPending(true);
    setFailure(null);

    try {
      await task();

      return true;
    } catch (error) {
      if (mounted.current) {
        setFailure(mapper.current(error));
      }

      return false;
    } finally {
      busy.current = false;

      if (mounted.current) {
        setPending(false);
      }
    }
  }

  return { pending, failure, run, reset: () => setFailure(null) };
}
