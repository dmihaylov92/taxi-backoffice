import { describe, expect, it } from "vitest";
import {
  blockingRideId,
  detailActions,
  rowActions,
} from "../../../../rides/domain/services/RideActionService";
import { acceptedRide, pendingRide } from "../../rideFixtures";

describe("RideActionService", () => {
  it("offers the row actions of the approved matrix per status", () => {
    expect(rowActions("PENDING")).toEqual([
      "view",
      "edit",
      "assign",
      "reject",
      "remove",
    ]);
    expect(rowActions("ACCEPTED")).toEqual(rowActions("PENDING"));
    expect(rowActions("FINISHED")).toEqual([
      "view",
      "edit",
      "assign",
      "reject",
      "reopen",
      "remove",
    ]);
    expect(rowActions("REJECTED")).toEqual([
      "view",
      "edit",
      "assign",
      "reopen",
      "remove",
    ]);
  });

  it("never leaves a status without edit, assign and delete", () => {
    for (const status of ["PENDING", "ACCEPTED", "FINISHED", "REJECTED"] as const) {
      expect(rowActions(status)).toEqual(
        expect.arrayContaining(["edit", "assign", "remove"]),
      );
    }
  });

  it("reopens only finished or rejected rides and never rejects twice", () => {
    expect(rowActions("PENDING")).not.toContain("reopen");
    expect(rowActions("ACCEPTED")).not.toContain("reopen");
    expect(rowActions("REJECTED")).not.toContain("reject");
  });

  it("keeps the details footer to assign and reject, or reopen", () => {
    expect(detailActions("PENDING")).toEqual(["assign", "reject"]);
    expect(detailActions("ACCEPTED")).toEqual(["assign", "reject"]);
    expect(detailActions("FINISHED")).toEqual(["reopen"]);
    expect(detailActions("REJECTED")).toEqual(["reopen"]);
  });

  it("blocks a driver who already holds another accepted ride", () => {
    const held = new Map([["drv-ivan", acceptedRide.id]]);

    expect(blockingRideId("drv-ivan", pendingRide, held)).toBe(acceptedRide.id);
  });

  it("does not block a driver by the ride being reassigned or by nothing", () => {
    const held = new Map([["drv-ivan", acceptedRide.id]]);

    expect(blockingRideId("drv-ivan", acceptedRide, held)).toBeUndefined();
    expect(blockingRideId("drv-petar", pendingRide, held)).toBeUndefined();
  });
});
