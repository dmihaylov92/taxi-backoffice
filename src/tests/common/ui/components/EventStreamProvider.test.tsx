import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EventDecoders } from "../../../../common/domain/models/EventDecoder";
import type {
  EventStreamApi,
  EventStreamHandlers,
} from "../../../../common/domain/services/EventStreamService";
import { EventStreamProvider } from "../../../../common/ui/components/EventStreamProvider";
import { StreamStatus } from "../../../../common/ui/components/StreamStatus";
import { useEventStream } from "../../../../common/ui/hooks/useEventStream";

function fakeStream() {
  const stop = vi.fn();
  let handlers: EventStreamHandlers | undefined;
  const api: EventStreamApi = {
    connect: vi.fn((given: EventStreamHandlers) => {
      handlers = given;

      return stop;
    }),
    listen: vi.fn(),
  };

  return {
    api,
    stop,
    message: (name: string, data: string) =>
      act(() => handlers?.onMessage(name, data)),
    ready: () => act(() => handlers?.onReady()),
    connection: (state: Parameters<EventStreamHandlers["onConnection"]>[0]) =>
      act(() => handlers?.onConnection(state)),
  };
}

const decoders: EventDecoders<{ id: string }> = {
  "thing.changed": (data) => {
    const parsed = JSON.parse(data) as { id?: string };

    return parsed.id ? { id: parsed.id } : undefined;
  },
};

function Listener({
  onEvent,
  onReady,
}: {
  onEvent: (event: { id: string }) => void;
  onReady?: () => void;
}) {
  useEventStream(decoders, { onEvent, onReady });

  return null;
}

function setup(enabled = true) {
  const stream = fakeStream();
  const onEvent = vi.fn();
  const onReady = vi.fn();
  const view = render(
    <EventStreamProvider
      eventStream={stream.api}
      enabled={enabled}
      onSessionExpired={vi.fn()}
    >
      <StreamStatus />
      <Listener onEvent={onEvent} onReady={onReady} />
    </EventStreamProvider>,
  );

  return { stream, onEvent, onReady, ...view };
}

describe("EventStreamProvider", () => {
  it("registers the events a component wants and passes on decoded ones only", async () => {
    const { stream, onEvent } = setup();

    expect(stream.api.listen).toHaveBeenCalledWith("thing.changed");

    await stream.message("thing.changed", '{"id":"a"}');
    await stream.message("thing.changed", "{}");
    await stream.message("other.changed", '{"id":"b"}');

    expect(onEvent.mock.calls).toEqual([[{ id: "a" }]]);
  });

  it("tells every component when the stream (re)connects", async () => {
    const { stream, onReady } = setup();

    await stream.ready();

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("stops listening when the component goes away", async () => {
    const { stream, onEvent, unmount } = setup();

    unmount();
    await stream.message("thing.changed", '{"id":"a"}');

    expect(onEvent).not.toHaveBeenCalled();
    expect(stream.stop).toHaveBeenCalledTimes(1);
  });

  it("shows the connection state and the paused notice only while it applies", async () => {
    const { stream } = setup();

    expect(screen.getByText("Свързване…")).toBeVisible();

    await stream.connection("live");
    expect(screen.getByText("Онлайн")).toBeVisible();

    await stream.connection("paused");
    expect(screen.getByText("Офлайн")).toBeVisible();
    expect(screen.getByText(/Връзката за живи обновления/)).toBeVisible();
  });

  it("opens no stream and shows nothing while disabled", () => {
    const { stream } = setup(false);

    expect(stream.api.connect).not.toHaveBeenCalled();
    expect(screen.queryByText("Свързване…")).not.toBeInTheDocument();
  });
});
