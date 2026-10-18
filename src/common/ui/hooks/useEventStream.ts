import { createContext, useContext, useEffect } from "react";
import type { EventDecoders } from "../../domain/models/EventDecoder";
import type { StreamConnection } from "../../domain/models/StreamConnection";
import { useLatest } from "./useLatest";

export interface StreamListener {
  /** The event names this listener wants. */
  events: readonly string[];
  onMessage(name: string, data: string): void;
  /** The stream was (re)connected; anything shown may be stale. */
  onReady(): void;
}

export interface EventStreamHub {
  /** Registers a listener for as long as the caller stays mounted; returns how to stop. */
  subscribe(listener: StreamListener): () => void;
}

/** Without a provider (live updates unavailable) there is simply nothing to listen to. */
const NO_EVENT_STREAM: EventStreamHub = { subscribe: () => () => undefined };

export const EventStreamContext =
  createContext<EventStreamHub>(NO_EVENT_STREAM);

/** State of the live stream; undefined while there is none (signed out, or no module that needs it). */
export const StreamConnectionContext = createContext<
  StreamConnection | undefined
>(undefined);

export function useStreamConnection(): StreamConnection | undefined {
  return useContext(StreamConnectionContext);
}

interface EventStreamHandlers<Event> {
  onEvent(event: Event): void;
  /** The stream (re)connected, so what is shown may have missed changes. */
  onReady?(): void;
}

/**
 * Plugs a component into the application's shared event stream. Connecting, reconnecting, session
 * renewal and the connection indicator are handled centrally; the component only says which events
 * it wants and how to read them. Handlers may change on every render; the decoders object must be
 * stable (for example a module constant).
 */
export function useEventStream<Event>(
  decoders: EventDecoders<Event>,
  handlers: EventStreamHandlers<Event>,
): void {
  const hub = useContext(EventStreamContext);
  const latest = useLatest(handlers);

  useEffect(
    () =>
      hub.subscribe({
        events: Object.keys(decoders),
        onMessage: (name, data) => {
          const event = decoders[name]?.(data);

          if (event !== undefined) {
            latest.current.onEvent(event);
          }
        },
        onReady: () => latest.current.onReady?.(),
      }),
    [hub, decoders, latest],
  );
}
