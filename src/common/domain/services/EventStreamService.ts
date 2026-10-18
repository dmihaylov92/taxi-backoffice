import {
  EventStreamClient,
  READY_EVENT,
  type EventStreamConnectionHandle,
} from "../clients/EventStreamClient";
import type { StreamConnection } from "../models/StreamConnection";

export interface EventStreamHandlers {
  /** A named event of a kind somebody listens for, as raw text. */
  onMessage(name: string, data: string): void;
  /** The stream is (re)connected and state may be stale, so listeners should refetch. */
  onReady(): void;
  onConnection(state: StreamConnection): void;
  /** The session could not be renewed; the stream stays closed. */
  onSessionExpired(): void;
}

export interface EventStreamApi {
  /** Keeps a stream open, reconnecting as needed, until the returned function is called. */
  connect(handlers: EventStreamHandlers): () => void;
  /** Delivers events with this name, on the open stream and on every later one. */
  listen(name: string): void;
}

const BACKOFF_BASE_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

/** A connection that stayed up this long was healthy; a shorter one is a flapping stream (for example two tabs replacing each other). */
const STABLE_MS = 10_000;

/** Exponential delay capped at the maximum, spread over its upper half so clients do not reconnect together. */
export function reconnectDelay(attempt: number, random: number): number {
  const ceiling = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** attempt);

  return Math.round(ceiling * (0.5 + random / 2));
}

/**
 * Owns the life of one event stream for the whole application: opens it, hands on messages, and
 * reconnects with backoff after a drop. A stream the browser closed for good is most likely a
 * rejected session, so the session is renewed first; when that fails the stream stays closed and
 * the host signs out. Features never manage a connection; they only listen for event names.
 */
export class EventStreamService implements EventStreamApi {
  private readonly names = new Set<string>();
  private attach: ((name: string) => void) | undefined;

  constructor(
    private readonly client: EventStreamClient,
    private readonly renewSession: () => Promise<boolean> = async () => true,
    private readonly random: () => number = Math.random,
  ) {}

  listen(name: string): void {
    this.names.add(name);
    this.attach?.(name);
  }

  connect(handlers: EventStreamHandlers): () => void {
    let stopped = false;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let current: EventStreamConnectionHandle | undefined;
    let liveSince: number | undefined;

    const release = () => {
      current?.close();
      current = undefined;
      this.attach = undefined;
    };

    const scheduleReconnect = () => {
      timer = setTimeout(open, reconnectDelay(attempt, this.random()));
      attempt += 1;
    };

    const fail = async (streamClosed: boolean) => {
      release();

      if (stopped) {
        return;
      }

      if (liveSince !== undefined && Date.now() - liveSince >= STABLE_MS) {
        attempt = 0;
      }

      liveSince = undefined;
      handlers.onConnection("paused");

      // Unable to tell (for example offline) is not a rejected session: keep trying.
      const renewed = streamClosed
        ? await this.renewSession().catch(() => true)
        : true;

      if (stopped) {
        return;
      }

      if (!renewed) {
        stopped = true;
        handlers.onSessionExpired();

        return;
      }

      scheduleReconnect();
    };

    const open = () => {
      const handle: EventStreamConnectionHandle = this.client.connect({
        onMessage: (name, data) => {
          if (current !== handle) {
            return;
          }

          if (name === READY_EVENT) {
            liveSince = Date.now();
            handlers.onConnection("live");
            handlers.onReady();

            return;
          }

          handlers.onMessage(name, data);
        },
        onError: (streamClosed) => {
          if (current === handle) {
            void fail(streamClosed);
          }
        },
      });

      current = handle;
      this.attach = handle.listen;
      this.names.forEach(handle.listen);
    };

    handlers.onConnection("connecting");
    open();

    return () => {
      stopped = true;
      clearTimeout(timer);
      release();
    };
  }
}
