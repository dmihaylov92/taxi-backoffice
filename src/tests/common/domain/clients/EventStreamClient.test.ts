import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventStreamClient } from "../../../../common/domain/clients/EventStreamClient";
import { FakeEventSource, fakeEventSourceFactory } from "../../fakeEventSource";

function client() {
  return new EventStreamClient("/api/v1/events", fakeEventSourceFactory());
}

describe("EventStreamClient", () => {
  beforeEach(() => FakeEventSource.reset());

  it("opens the stream at its path and always hands ready over", () => {
    const onMessage = vi.fn();

    client().connect({ onMessage, onError: vi.fn() });
    FakeEventSource.latest.emit("ready", {});

    expect(FakeEventSource.latest.url).toBe("/api/v1/events");
    expect(onMessage.mock.calls).toEqual([["ready", "{}"]]);
  });

  it("hands over only the events somebody listens for, as raw text", () => {
    const onMessage = vi.fn();
    const handle = client().connect({ onMessage, onError: vi.fn() });

    FakeEventSource.latest.emit("ride.updated", { ride: { id: "a" } });
    handle.listen("ride.updated");
    FakeEventSource.latest.emit("ride.updated", { ride: { id: "a" } });
    FakeEventSource.latest.emit("ride.deleted", { id: "a" });

    expect(onMessage.mock.calls).toEqual([
      ["ride.updated", '{"ride":{"id":"a"}}'],
    ]);
  });

  it("registers one browser listener however often a name is listened for", () => {
    const handle = client().connect({ onMessage: vi.fn(), onError: vi.fn() });
    const source = FakeEventSource.latest;
    const add = vi.spyOn(source, "addEventListener");

    handle.listen("ride.updated");
    handle.listen("ride.updated");

    expect(add).toHaveBeenCalledTimes(1);
  });

  it("tells whether the browser gave up on the connection", () => {
    const onError = vi.fn();

    client().connect({ onMessage: vi.fn(), onError });
    FakeEventSource.latest.fail(false);
    FakeEventSource.latest.fail(true);

    expect(onError.mock.calls).toEqual([[false], [true]]);
  });

  it("closes the stream on request", () => {
    const handle = client().connect({ onMessage: vi.fn(), onError: vi.fn() });

    handle.close();

    expect(FakeEventSource.latest.closed).toBe(true);
  });
});
