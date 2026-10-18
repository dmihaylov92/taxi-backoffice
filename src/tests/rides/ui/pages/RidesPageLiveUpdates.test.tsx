import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { App } from "../../../../App";
import type { AccountApi } from "../../../../accounts/domain/services/AccountService";
import type { AuthApi } from "../../../../auth/domain/services/AuthService";
import { bg } from "../../../../auth/ui/assets/copy";
import type { Role } from "../../../../common/domain/models/Role";
import type { Ride } from "../../../../rides/domain/models/Ride";
import type { StreamConnection } from "../../../../common/domain/models/StreamConnection";
import type {
  EventStreamApi,
  EventStreamHandlers,
} from "../../../../common/domain/services/EventStreamService";
import { stream as streamCopy } from "../../../../common/ui/assets/copy";
import type { RideEvent } from "../../../../rides/domain/models/RideEvent";
import { ridesCopy } from "../../../../rides/ui/assets/rideCopy";
import {
  acceptedRide,
  pendingRide,
  rideApi,
} from "../../rideFixtures";

const dispatcher = {
  id: "acc-dispatcher",
  email: "dispatcher@taxi.test",
  roles: ["DISPATCHER"] as Role[],
};

/** A stream the test drives directly, in place of the real service and EventSource. */
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
  const send = (event: RideEvent) =>
    event.type === "updated"
      ? handlers?.onMessage("ride.updated", JSON.stringify({ ride: event.ride }))
      : handlers?.onMessage("ride.deleted", JSON.stringify({ id: event.id }));

  return {
    api,
    stop,
    event: (event: RideEvent) => act(() => send(event)),
    burst: (events: RideEvent[]) =>
      act(() => events.forEach(send)),
    ready: () => act(() => handlers?.onReady()),
    connection: (state: StreamConnection) =>
      act(() => handlers?.onConnection(state)),
    expire: () => act(() => handlers?.onSessionExpired()),
  };
}

function renderRides(
  identity = dispatcher,
  path = "/rides",
  rides = rideApi(),
) {
  const stream = fakeStream();
  const auth: AuthApi = {
    session: vi.fn().mockResolvedValue(identity),
    login: vi.fn(),
    forgot: vi.fn(),
    reset: vi.fn(),
    logout: vi.fn().mockResolvedValue(true),
  };
  const accounts = {
    list: vi.fn().mockResolvedValue({ items: [], hasNext: false }),
  } as unknown as AccountApi;
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <App auth={auth} accounts={accounts} rides={rides} eventStream={stream.api} />
    </MemoryRouter>,
  );

  return { stream, rides, ...view };
}

/** jsdom has no AnimationEvent, so React listens for the prefixed name; send both. */
function endGlow(row: HTMLElement) {
  fireEvent(row, new Event("animationend", { bubbles: true }));
  fireEvent(row, new Event("webkitAnimationEnd", { bubbles: true }));
}

async function rowFor(number: string) {
  const table = await screen.findByRole("table");

  return within(table).getByRole("row", { name: new RegExp(number) });
}

describe("RidesPage live updates", () => {
  it("shows a changed ride in place without reloading", async () => {
    const { stream, rides } = renderRides();
    await rowFor("001047");

    await stream.event({
      type: "updated",
      ride: {
        ...acceptedRide,
        status: "FINISHED",
        updatedAt: "2026-08-14T11:00:00Z",
      },
    });

    const row = await rowFor("001047");
    expect(within(row).getByText(ridesCopy.statuses.FINISHED)).toBeVisible();
    expect(rides.list).toHaveBeenCalledTimes(1);
  });

  it("makes a changed row glow until its animation ends, and restarts it on a repeat change", async () => {
    const { stream } = renderRides();
    const quiet = await rowFor("001047");
    expect(quiet).not.toHaveClass("row-changed-even");

    await stream.event({
      type: "updated",
      ride: { ...acceptedRide, status: "FINISHED", updatedAt: "2026-08-14T11:00:00Z" },
    });
    expect(await rowFor("001047")).toHaveClass("row-changed-even");

    await stream.event({
      type: "updated",
      ride: { ...acceptedRide, status: "FINISHED", updatedAt: "2026-08-14T11:01:00Z" },
    });
    expect(await rowFor("001047")).toHaveClass("row-changed-odd");

    endGlow(await rowFor("001047"));

    expect(await rowFor("001047")).not.toHaveClass("row-changed-odd");
  });

  it("does not glow a row for a stale event or glow anything for a deletion", async () => {
    const { stream } = renderRides();
    await rowFor("001047");
    await stream.event({
      type: "updated",
      ride: { ...acceptedRide, status: "FINISHED", updatedAt: "2026-08-14T11:00:00Z" },
    });
    endGlow(await rowFor("001047"));

    await stream.event({
      type: "updated",
      ride: { ...acceptedRide, status: "ACCEPTED", updatedAt: "2026-08-14T10:00:00Z" },
    });
    await stream.event({ type: "deleted", id: "unknown" });

    expect(await rowFor("001047")).not.toHaveClass("row-changed-even");
  });

  it("adds a new ride at the top and removes a deleted one", async () => {
    const { stream } = renderRides();
    await rowFor("001047");

    await stream.event({
      type: "updated",
      ride: {
        ...pendingRide,
        id: "aaaaaaaaaaaaaaaaaa001049",
        createdAt: "2026-08-14T11:00:00",
        updatedAt: "2026-08-14T11:00:00Z",
      },
    });

    const table = screen.getByRole("table");
    const bodyRows = within(table).getAllByRole("row").slice(1);
    expect(bodyRows[0]).toHaveAccessibleName(/001049/);

    await stream.event({ type: "deleted", id: acceptedRide.id });

    expect(
      within(table).queryByRole("row", { name: /001047/ }),
    ).not.toBeInTheDocument();
  });

  it("refetches the current page whenever the stream reports ready", async () => {
    const { stream, rides } = renderRides();
    await rowFor("001047");
    expect(rides.list).toHaveBeenCalledTimes(1);

    await stream.ready();

    await waitFor(() => expect(rides.list).toHaveBeenCalledTimes(2));
  });

  it("loads once more after a page that was loading when an event arrived", async () => {
    let finish: (page: { items: Ride[]; hasNext: boolean }) => void = () => undefined;
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items: [acceptedRide], hasNext: false })
      .mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
      .mockResolvedValue({ items: [], hasNext: false });
    const { stream } = renderRides(dispatcher, "/rides", rideApi({ list }));
    await rowFor("001047");

    await stream.ready();
    await stream.event({ type: "deleted", id: acceptedRide.id });
    await stream.event({ type: "deleted", id: "other" });
    expect(list).toHaveBeenCalledTimes(2);

    await act(async () => finish({ items: [acceptedRide], hasNext: false }));

    await waitFor(() => expect(list).toHaveBeenCalledTimes(3));
  });

  it("keeps every update of a burst that arrives before the page re-renders", async () => {
    const { stream } = renderRides(
      dispatcher,
      "/rides",
      rideApi({
        list: vi.fn().mockResolvedValue({
          items: [acceptedRide, pendingRide],
          hasNext: false,
        }),
      }),
    );
    await rowFor("001047");

    await stream.burst([
      {
        type: "updated",
        ride: { ...acceptedRide, status: "FINISHED", updatedAt: "2026-08-14T11:00:00Z" },
      },
      {
        type: "updated",
        ride: { ...pendingRide, status: "REJECTED", updatedAt: "2026-08-14T11:00:00Z" },
      },
    ]);

    const table = screen.getByRole("table");
    expect(within(table).getAllByText(ridesCopy.statuses.FINISHED)).not.toHaveLength(0);
    expect(within(table).getAllByText(ridesCopy.statuses.REJECTED)).not.toHaveLength(0);
  });

  it("shows a notice only while the stream is down", async () => {
    const { stream } = renderRides();
    await rowFor("001047");
    expect(screen.queryByText(streamCopy.paused)).not.toBeInTheDocument();

    await stream.connection("paused");
    expect(screen.getByText(streamCopy.paused)).toBeVisible();

    await stream.connection("live");
    expect(screen.queryByText(streamCopy.paused)).not.toBeInTheDocument();
  });

  it("shows the connection state in the top bar", async () => {
    const { stream } = renderRides();
    await rowFor("001047");
    const status = () => document.querySelector(".shell-top .live-status");

    expect(status()).toHaveTextContent(streamCopy.status.connecting);

    await stream.connection("live");
    expect(status()).toHaveTextContent(streamCopy.status.live);

    await stream.connection("paused");
    expect(status()).toHaveTextContent(streamCopy.status.paused);
  });

  it("shows no connection state for an account without a live stream", async () => {
    renderRides(
      { id: "acc-admin", email: "admin@taxi.test", roles: ["ADMIN"] },
      "/accounts",
    );

    await screen.findByRole("heading", { level: 1 });

    expect(document.querySelector(".live-status")).toBeNull();
  });

  it("closes the stream when the page goes away", async () => {
    const { stream, unmount } = renderRides();
    await rowFor("001047");

    unmount();

    expect(stream.stop).toHaveBeenCalledTimes(1);
  });

  it("signs the user out when the stream cannot renew the session", async () => {
    const { stream } = renderRides();
    await rowFor("001047");

    await stream.expire();

    expect(await screen.findByText(bg.session)).toBeVisible();
    expect(stream.stop).toHaveBeenCalled();
  });

  it("does not open a stream for an account that cannot see rides", async () => {
    const { stream } = renderRides(
      { id: "acc-admin", email: "admin@taxi.test", roles: ["ADMIN"] },
      "/accounts",
    );

    await screen.findByRole("heading", { level: 1 });

    expect(stream.api.connect).not.toHaveBeenCalled();
  });
});
