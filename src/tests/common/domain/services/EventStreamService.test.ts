import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventStreamClient } from "../../../../common/domain/clients/EventStreamClient";
import {
  EventStreamService,
  reconnectDelay,
  type EventStreamHandlers,
} from "../../../../common/domain/services/EventStreamService";
import {
  FakeEventSource,
  fakeEventSourceFactory,
} from "../../fakeEventSource";

const thing = { id: "a" };

function handlers(): EventStreamHandlers {
  return {
    onMessage: vi.fn(),
    onReady: vi.fn(),
    onConnection: vi.fn(),
    onSessionExpired: vi.fn(),
  };
}

function service(renew: () => Promise<boolean> = async () => true) {
  const created = new EventStreamService(
    new EventStreamClient("/api/v1/events", fakeEventSourceFactory()),
    renew,
    () => 0,
  );

  created.listen("thing.changed");

  return created;
}

/** Lets pending promise callbacks run without moving the fake clock. */
async function settle() {
  await vi.advanceTimersByTimeAsync(0);
}

describe("reconnectDelay", () => {
  it("doubles each attempt up to a cap and spreads over the upper half", () => {
    expect(reconnectDelay(0, 0)).toBe(500);
    expect(reconnectDelay(0, 1)).toBe(1000);
    expect(reconnectDelay(1, 1)).toBe(2000);
    expect(reconnectDelay(3, 0)).toBe(4000);
    expect(reconnectDelay(10, 1)).toBe(30_000);
    expect(reconnectDelay(10, 0)).toBe(15_000);
  });
});

describe("EventStreamService", () => {
  beforeEach(() => {
    FakeEventSource.reset();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it("connects, reports ready as live and passes the events somebody listens for on", () => {
    const received = handlers();

    service().connect(received);

    expect(received.onConnection).toHaveBeenLastCalledWith("connecting");

    FakeEventSource.latest.emit("ready", {});
    FakeEventSource.latest.emit("thing.changed", thing);
    FakeEventSource.latest.emit("thing.changed", { id: "b" });
    FakeEventSource.latest.emit("thing.removed", thing);

    expect(received.onConnection).toHaveBeenLastCalledWith("live");
    expect(received.onReady).toHaveBeenCalledTimes(1);
    expect(received.onMessage).toHaveBeenCalledTimes(2);
    expect(received.onMessage).toHaveBeenNthCalledWith(1, "thing.changed", '{"id":"a"}');
    expect(received.onMessage).toHaveBeenNthCalledWith(2, "thing.changed", '{"id":"b"}');
  });

  it("listens for a name added later on the open stream and on every reconnect", async () => {
    const received = handlers();
    const created = service();

    created.connect(received);
    created.listen("other.changed");
    FakeEventSource.latest.emit("other.changed", thing);
    FakeEventSource.latest.fail(false);
    await vi.advanceTimersByTimeAsync(500);
    FakeEventSource.latest.emit("thing.changed", thing);
    FakeEventSource.latest.emit("other.changed", thing);

    expect(received.onMessage).toHaveBeenCalledTimes(3);
  });

  it("pauses on a dropped connection and reconnects after a backoff, refetching on ready", async () => {
    const received = handlers();

    service().connect(received);
    FakeEventSource.latest.emit("ready", {});
    FakeEventSource.latest.fail(false);

    expect(received.onConnection).toHaveBeenLastCalledWith("paused");
    expect(FakeEventSource.latest.closed).toBe(true);
    expect(FakeEventSource.instances).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(499);
    expect(FakeEventSource.instances).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(1);
    expect(FakeEventSource.instances).toHaveLength(2);

    FakeEventSource.latest.emit("ready", {});

    expect(received.onConnection).toHaveBeenLastCalledWith("live");
    expect(received.onReady).toHaveBeenCalledTimes(2);
  });

  it("backs off further while reconnecting keeps failing and starts over after a stable connection", async () => {
    service().connect(handlers());

    FakeEventSource.latest.fail(false);
    await vi.advanceTimersByTimeAsync(500);
    FakeEventSource.latest.fail(false);
    await vi.advanceTimersByTimeAsync(999);
    expect(FakeEventSource.instances).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(FakeEventSource.instances).toHaveLength(3);

    FakeEventSource.latest.emit("ready", {});
    await vi.advanceTimersByTimeAsync(10_000);
    FakeEventSource.latest.fail(false);
    await vi.advanceTimersByTimeAsync(500);

    expect(FakeEventSource.instances).toHaveLength(4);
  });

  it("keeps backing off while a connection drops right after each ready", async () => {
    service().connect(handlers());

    FakeEventSource.latest.emit("ready", {});
    FakeEventSource.latest.fail(false);
    await vi.advanceTimersByTimeAsync(500);
    FakeEventSource.latest.emit("ready", {});
    FakeEventSource.latest.fail(false);
    await vi.advanceTimersByTimeAsync(999);
    expect(FakeEventSource.instances).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(1);
    expect(FakeEventSource.instances).toHaveLength(3);
  });

  it("renews the session before reconnecting after the browser gave up", async () => {
    const renew = vi.fn().mockResolvedValue(true);
    const received = handlers();

    service(renew).connect(received);
    FakeEventSource.latest.fail(true);
    await settle();

    expect(renew).toHaveBeenCalledTimes(1);
    expect(received.onSessionExpired).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);

    expect(FakeEventSource.instances).toHaveLength(2);
  });

  it("does not renew the session for an ordinary network drop", async () => {
    const renew = vi.fn().mockResolvedValue(true);

    service(renew).connect(handlers());
    FakeEventSource.latest.fail(false);
    await settle();

    expect(renew).not.toHaveBeenCalled();
  });

  it("stays closed and reports an expired session when it cannot be renewed", async () => {
    const received = handlers();

    service(async () => false).connect(received);
    FakeEventSource.latest.fail(true);
    await settle();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(received.onSessionExpired).toHaveBeenCalledTimes(1);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("keeps trying when renewing the session fails for another reason", async () => {
    const received = handlers();

    service(() => Promise.reject(new Error("offline"))).connect(received);
    FakeEventSource.latest.fail(true);
    await settle();
    await vi.advanceTimersByTimeAsync(500);

    expect(received.onSessionExpired).not.toHaveBeenCalled();
    expect(FakeEventSource.instances).toHaveLength(2);
  });

  it("ignores messages and errors from a connection it already replaced", async () => {
    const received = handlers();

    service().connect(received);
    const first = FakeEventSource.latest;
    first.fail(false);
    await vi.advanceTimersByTimeAsync(500);
    first.emit("thing.changed", thing);
    first.fail(false);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(received.onMessage).not.toHaveBeenCalled();
    expect(FakeEventSource.instances).toHaveLength(2);
  });

  it("closes the stream and cancels a pending reconnect when stopped", async () => {
    const stop = service().connect(handlers());

    FakeEventSource.latest.fail(false);
    stop();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(FakeEventSource.instances).toHaveLength(1);

    const stopLive = service().connect(handlers());
    stopLive();

    expect(FakeEventSource.latest.closed).toBe(true);
  });

  it("does not reconnect after a stop that arrives while the session is being renewed", async () => {
    const renew = vi.fn().mockResolvedValue(true);
    const stop = service(renew).connect(handlers());

    FakeEventSource.latest.fail(true);
    stop();
    await vi.advanceTimersByTimeAsync(60_000);

    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it("stays silent about an expired session when stopped meanwhile", async () => {
    const received = handlers();
    const stop = service(async () => false).connect(received);

    FakeEventSource.latest.fail(true);
    stop();
    await settle();

    expect(received.onSessionExpired).not.toHaveBeenCalled();
  });
});
