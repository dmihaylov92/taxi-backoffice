import type { EventSourceLike } from "../../common/domain/clients/EventStreamClient";

/** An `EventSource` double the test drives by hand. */
export class FakeEventSource implements EventSourceLike {
  static instances: FakeEventSource[] = [];

  readyState = 1;
  onerror: ((event: Event) => void) | null = null;
  closed = false;
  private readonly listeners = new Map<string, (event: MessageEvent<string>) => void>();

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }

  static reset() {
    FakeEventSource.instances = [];
  }

  static get latest(): FakeEventSource {
    return FakeEventSource.instances[FakeEventSource.instances.length - 1];
  }

  addEventListener(
    type: string,
    listener: (event: MessageEvent<string>) => void,
  ) {
    this.listeners.set(type, listener);
  }

  close() {
    this.closed = true;
    this.readyState = 2;
  }

  /** The server sent a named event. */
  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({
      data: typeof data === "string" ? data : JSON.stringify(data),
    } as MessageEvent<string>);
  }

  /** The connection failed; a rejected request leaves the source closed for good. */
  fail(closedForGood: boolean) {
    this.readyState = closedForGood ? 2 : 0;
    this.onerror?.(new Event("error"));
  }
}

export function fakeEventSourceFactory() {
  return (url: string) => new FakeEventSource(url);
}
