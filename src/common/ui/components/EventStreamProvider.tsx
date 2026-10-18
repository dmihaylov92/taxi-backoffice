import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { StreamConnection } from "../../domain/models/StreamConnection";
import type { EventStreamApi } from "../../domain/services/EventStreamService";
import { stream } from "../assets/copy";
import {
  EventStreamContext,
  StreamConnectionContext,
  type EventStreamHub,
  type StreamListener,
} from "../hooks/useEventStream";
import { useLatest } from "../hooks/useLatest";

interface EventStreamProviderProps {
  eventStream: EventStreamApi;
  /** False while nobody who needs the stream is signed in; the stream is closed then. */
  enabled: boolean;
  /** The session could not be renewed; the host signs the user out. */
  onSessionExpired: () => void;
  children: ReactNode;
}

/**
 * Keeps one live stream for the whole signed-in application and fans its events out to whichever
 * screens listen. A small notice shows only while the stream is down.
 */
export function EventStreamProvider({
  eventStream,
  enabled,
  onSessionExpired,
  children,
}: EventStreamProviderProps) {
  const listeners = useRef(new Set<StreamListener>());
  const expired = useLatest(onSessionExpired);
  const [connection, setConnection] = useState<StreamConnection>("connecting");

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return eventStream.connect({
      onMessage: (name, data) =>
        listeners.current.forEach((listener) => {
          if (listener.events.includes(name)) {
            listener.onMessage(name, data);
          }
        }),
      onReady: () =>
        listeners.current.forEach((listener) => listener.onReady()),
      onConnection: setConnection,
      onSessionExpired: () => expired.current(),
    });
  }, [eventStream, enabled, expired]);

  const hub: EventStreamHub = useMemo(
    () => ({
      subscribe: (listener) => {
        listener.events.forEach((name) => eventStream.listen(name));
        listeners.current.add(listener);

        return () => {
          listeners.current.delete(listener);
        };
      },
    }),
    [eventStream],
  );

  return (
    <EventStreamContext.Provider value={hub}>
      <StreamConnectionContext.Provider
        value={enabled ? connection : undefined}
      >
        {children}
      </StreamConnectionContext.Provider>
      <div className="live-updates" role="status" aria-live="polite">
        {enabled && connection === "paused" && (
          <p className="live-updates-notice">
            <span className="spinner" aria-hidden="true" />
            {stream.paused}
          </p>
        )}
      </div>
    </EventStreamContext.Provider>
  );
}
