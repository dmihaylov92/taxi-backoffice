import { useEffect, useRef } from "react";

/** Always-current reference to a value, for async callbacks that must not re-subscribe on change. */
export function useLatest<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  });

  return ref;
}
