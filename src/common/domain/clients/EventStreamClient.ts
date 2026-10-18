/** The event every stream sends first on each (re)connection; the transport always listens for it. */
export const READY_EVENT = "ready";

/** `EventSource.readyState` once the browser gave up on the connection, for example after a 401. */
const CLOSED = 2;

/** The part of `EventSource` the client uses, so tests can supply a fake. */
export interface EventSourceLike {
  readonly readyState: number;
  onerror: ((event: Event) => void) | null;
  addEventListener(
    type: string,
    listener: (event: MessageEvent<string>) => void,
  ): void;
  close(): void;
}

export type EventSourceFactory = (url: string) => EventSourceLike;

export interface EventStreamConnectionHandlers {
  onMessage(name: string, data: string): void;
  /** `streamClosed` is true when the browser stopped for good, which is how a rejected session looks. */
  onError(streamClosed: boolean): void;
}

export interface EventStreamConnectionHandle {
  /** Also delivers events with this name; listening twice for one name has no further effect. */
  listen(name: string): void;
  close(): void;
}

/**
 * Transport for one server-sent event stream. The same-origin session cookie authenticates the
 * request, so no credentials are handled here. Messages are handed over as raw text for the
 * listener to validate; only events somebody listens for are delivered.
 */
export class EventStreamClient {
  constructor(
    private readonly path: string,
    private readonly factory: EventSourceFactory = (url) =>
      new EventSource(url),
  ) {}

  connect(handlers: EventStreamConnectionHandlers): EventStreamConnectionHandle {
    const source = this.factory(this.path);
    const listening = new Set<string>();
    const listen = (name: string) => {
      if (listening.has(name)) {
        return;
      }

      listening.add(name);
      source.addEventListener(name, (event) =>
        handlers.onMessage(name, event.data),
      );
    };

    listen(READY_EVENT);
    source.onerror = () => handlers.onError(source.readyState === CLOSED);

    return { listen, close: () => source.close() };
  }
}
