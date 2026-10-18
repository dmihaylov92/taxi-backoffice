import { describe, expect, it } from "vitest";
import type { ListPage } from "../../../../common/domain/models/ListPage";
import type { Ride } from "../../../../rides/domain/models/Ride";
import type { RideEvent } from "../../../../rides/domain/models/RideEvent";
import { applyRideEvent } from "../../../../rides/domain/services/RideListUpdateService";

const SIZE = 3;

function ride(id: string, overrides: Partial<Ride> = {}): Ride {
  return {
    id,
    status: "PENDING",
    createdAt: `2026-08-14T10:0${id}:00Z`,
    updatedAt: `2026-08-14T10:0${id}:00Z`,
    ...overrides,
  };
}

function page(items: Ride[], hasNext = false): ListPage<Ride> {
  return { items, hasNext };
}

function updated(next: Ride): RideEvent {
  return { type: "updated", ride: next };
}

function ids(result: ListPage<Ride>): string[] {
  return result.items.map((row) => row.id);
}

describe("applyRideEvent", () => {
  it("replaces a ride already on the page in place", () => {
    const held = page([ride("3"), ride("2"), ride("1")]);
    const change = ride("2", {
      status: "ACCEPTED",
      updatedAt: "2026-08-14T11:00:00Z",
    });

    const result = applyRideEvent(held, {}, 0, updated(change), SIZE);

    expect(ids(result)).toEqual(["3", "2", "1"]);
    expect(result.items[1]).toBe(change);
  });

  it("removes a ride that no longer matches the status filter", () => {
    const held = page([ride("3"), ride("2"), ride("1")]);
    const change = ride("2", {
      status: "ACCEPTED",
      updatedAt: "2026-08-14T11:00:00Z",
    });

    const result = applyRideEvent(
      held,
      { status: "PENDING" },
      0,
      updated(change),
      SIZE,
    );

    expect(ids(result)).toEqual(["3", "1"]);
  });

  it("keeps a ride that still matches the status filter", () => {
    const held = page([ride("2", { status: "ACCEPTED" })]);
    const change = ride("2", {
      status: "ACCEPTED",
      driverId: "drv",
      updatedAt: "2026-08-14T11:00:00Z",
    });

    const result = applyRideEvent(
      held,
      { status: "ACCEPTED" },
      2,
      updated(change),
      SIZE,
    );

    expect(result.items).toEqual([change]);
  });

  it("adds a new ride at the top of the first page", () => {
    const held = page([ride("2"), ride("1")]);

    const result = applyRideEvent(held, {}, 0, updated(ride("3")), SIZE);

    expect(ids(result)).toEqual(["3", "2", "1"]);
    expect(result.hasNext).toBe(false);
  });

  it("trims the page to its size and reports a following page when a row is pushed off", () => {
    const held = page([ride("3"), ride("2"), ride("1")]);

    const result = applyRideEvent(held, {}, 0, updated(ride("4")), SIZE);

    expect(ids(result)).toEqual(["4", "3", "2"]);
    expect(result.hasNext).toBe(true);
  });

  it("does not add a new ride older than every row of a full page, but knows more follow", () => {
    const held = page([ride("3"), ride("2"), ride("1")], true);

    const result = applyRideEvent(held, {}, 0, updated(ride("0")), SIZE);

    expect(ids(result)).toEqual(["3", "2", "1"]);
    expect(result.hasNext).toBe(true);
  });

  it("places an older ride unseen by the page among its neighbours", () => {
    const held = page([ride("3"), ride("1")]);

    const result = applyRideEvent(held, {}, 0, updated(ride("2")), SIZE);

    expect(ids(result)).toEqual(["3", "2", "1"]);
  });

  it("ignores a new ride that does not match the status filter", () => {
    const held = page([ride("2"), ride("1")]);

    const result = applyRideEvent(
      held,
      { status: "ACCEPTED" },
      0,
      updated(ride("3")),
      SIZE,
    );

    expect(result).toBe(held);
  });

  it("ignores a ride the page has not seen when another page is shown", () => {
    const held = page([ride("2"), ride("1")]);

    const result = applyRideEvent(held, {}, 1, updated(ride("3")), SIZE);

    expect(result).toBe(held);
  });

  it("ignores an event older than the row held", () => {
    const held = page([
      ride("2", { status: "ACCEPTED", updatedAt: "2026-08-14T12:00:00Z" }),
    ]);
    const late = ride("2", { updatedAt: "2026-08-14T11:00:00Z" });

    const result = applyRideEvent(held, {}, 0, updated(late), SIZE);

    expect(result).toBe(held);
  });

  it("applies an event with the same time again without harm", () => {
    const held = page([ride("2", { status: "ACCEPTED" })]);
    const repeat = ride("2", { status: "ACCEPTED" });

    const result = applyRideEvent(held, {}, 0, updated(repeat), SIZE);

    expect(result.items).toEqual([repeat]);
  });

  it("accepts an event when either time is unknown", () => {
    const held = page([ride("2", { updatedAt: undefined })]);
    const change = ride("2", { status: "ACCEPTED" });

    const result = applyRideEvent(held, {}, 0, updated(change), SIZE);

    expect(result.items[0].status).toBe("ACCEPTED");
  });

  it("puts a new ride without a creation time at the top", () => {
    const held = page([ride("2")]);
    const unknown = ride("9", { createdAt: undefined });

    const result = applyRideEvent(held, {}, 0, updated(unknown), SIZE);

    expect(ids(result)).toEqual(["9", "2"]);
  });

  it("skips rows without a creation time when placing a new ride", () => {
    const held = page([ride("2", { createdAt: undefined }), ride("1")]);

    const result = applyRideEvent(held, {}, 0, updated(ride("3")), SIZE);

    expect(ids(result)).toEqual(["2", "3", "1"]);
  });

  it("removes a deleted ride and ignores one the page does not hold", () => {
    const held = page([ride("2"), ride("1")], true);

    const removed = applyRideEvent(
      held,
      {},
      0,
      { type: "deleted", id: "2" },
      SIZE,
    );
    const unknown = applyRideEvent(
      held,
      {},
      0,
      { type: "deleted", id: "9" },
      SIZE,
    );

    expect(ids(removed)).toEqual(["1"]);
    expect(removed.hasNext).toBe(true);
    expect(ids(unknown)).toEqual(["2", "1"]);
  });
});
