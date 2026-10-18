import { stream } from "../assets/copy";
import { useStreamConnection } from "../hooks/useEventStream";

/** Shows whether the page is receiving live updates; nothing while there is no stream to report on. */
export function StreamStatus() {
  const connection = useStreamConnection();

  if (!connection) {
    return null;
  }

  return (
    <span
      className={`live-status live-status-${connection}`}
      role="status"
      aria-live="polite"
    >
      <span className="live-status-dot" aria-hidden="true" />
      <span className="live-status-label">{stream.status[connection]}</span>
    </span>
  );
}
