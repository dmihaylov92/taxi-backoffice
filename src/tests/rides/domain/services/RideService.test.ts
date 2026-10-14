import { describe, expect, it, vi } from "vitest";
import type { DriverLookupClient } from "../../../../rides/domain/clients/DriverLookupClient";
import type { RideClient } from "../../../../rides/domain/clients/RideClient";
import { EMPTY_RIDE_DRAFT } from "../../../../rides/domain/models/RideDraft";
import {
  PAGE_SIZE,
  RideService,
  type RideApi,
} from "../../../../rides/domain/services/RideService";

function wireRide(id: string, status = "PENDING", driverId?: string) {
  return { id, status, driverId };
}

function serviceWith(
  client: Partial<RideClient>,
  lookup: Partial<DriverLookupClient> = {},
): RideApi {
  return new RideService(client as RideClient, lookup as DriverLookupClient);
}

describe("RideService", () => {
  it("reports every contract gap as an unavailable capability", () => {
    const service = serviceWith({});

    expect(service.capabilities).toEqual({
      rideType: false,
      estimatedDistance: false,
      driverOnCreate: false,
      driverNotifications: false,
    });
    expect(service.assign).toBeUndefined();
    expect(service.reopen).toBeUndefined();
    expect(service.suggestAddresses).toBeUndefined();
  });

  it("lists a page with the status filter and signal", async () => {
    const controller = new AbortController();
    const list = vi.fn().mockResolvedValue([wireRide("r1"), wireRide("r2")]);
    const service = serviceWith({ list });

    const page = await service.list(
      { status: "PENDING" },
      1,
      controller.signal,
    );

    expect(list).toHaveBeenCalledWith(
      `status=PENDING&page=1&size=${PAGE_SIZE}`,
      controller.signal,
    );
    expect(page.items.map((ride) => ride.id)).toEqual(["r1", "r2"]);
    expect(page.hasNext).toBe(false);
  });

  it("takes a full page to have a successor", async () => {
    const full = Array.from({ length: PAGE_SIZE }, (_, index) =>
      wireRide(`r${index}`),
    );
    const service = serviceWith({ list: vi.fn().mockResolvedValue(full) });

    expect((await service.list({}, 0)).hasNext).toBe(true);
  });

  it("creates and updates with the mapped body and returns the stored ride", async () => {
    const create = vi.fn().mockResolvedValue(wireRide("r9"));
    const update = vi.fn().mockResolvedValue(wireRide("r9", "ACCEPTED"));
    const service = serviceWith({ create, update });
    const draft = {
      ...EMPTY_RIDE_DRAFT,
      phone: "888123456",
      pickupAddress: "A",
      destinationAddress: "B",
    };
    const body = {
      phoneNumber: "+359888123456",
      pickupAddress: "A",
      destinationAddress: "B",
    };

    expect((await service.create(draft)).id).toBe("r9");
    expect((await service.update("r9", draft)).status).toBe("ACCEPTED");
    expect(create).toHaveBeenCalledWith(body);
    expect(update).toHaveBeenCalledWith("r9", body);
  });

  it("updates an accepted ride whose draft carries its driver", async () => {
    const update = vi.fn().mockResolvedValue(wireRide("r9", "ACCEPTED", "d1"));
    const service = serviceWith({ update });

    await service.update("r9", {
      ...EMPTY_RIDE_DRAFT,
      phone: "888123456",
      pickupAddress: "A",
      destinationAddress: "B",
      driverId: "d1",
    });

    expect(update).toHaveBeenCalledWith("r9", {
      phoneNumber: "+359888123456",
      pickupAddress: "A",
      destinationAddress: "B",
    });
  });

  it("refuses to create a ride with a driver the API cannot store", async () => {
    const create = vi.fn();
    const service = serviceWith({ create });

    await expect(
      service.create({ ...EMPTY_RIDE_DRAFT, driverId: "d1" }),
    ).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects, removes and propagates a refusal", async () => {
    const reject = vi.fn().mockResolvedValue(wireRide("r1", "REJECTED"));
    const remove = vi.fn().mockRejectedValue(new Error("refused"));
    const service = serviceWith({ reject, remove });

    expect((await service.reject("r1")).status).toBe("REJECTED");
    await expect(service.remove("r1")).rejects.toThrow("refused");
  });

  it("looks up drivers with availability through the accounts lookup", async () => {
    const search = vi.fn().mockResolvedValue([
      { id: "d1", email: "d1@taxi.test", availability: "BUSY" },
      { id: "d2", email: "d2@taxi.test" },
    ]);
    const service = serviceWith({}, { search });

    const drivers = await service.drivers();

    expect(search).toHaveBeenCalledWith("", 100, undefined, "ALL");
    expect(drivers.map((driver) => driver.availability)).toEqual([
      "BUSY",
      undefined,
    ]);
  });

  it("maps each driver to the accepted ride they hold in one request", async () => {
    const list = vi
      .fn()
      .mockResolvedValue([
        wireRide("r3", "ACCEPTED", "d3"),
        wireRide("last", "ACCEPTED", "dLast"),
      ]);
    const service = serviceWith({ list });

    const held = await service.acceptedAssignments();

    expect(held.get("d3")).toBe("r3");
    expect(held.get("dLast")).toBe("last");
    expect(list.mock.calls.map((call) => call[0])).toEqual([
      "status=ACCEPTED&page=0&size=100",
    ]);
  });

  it("ignores accepted rides that have lost their driver", async () => {
    const service = serviceWith({
      list: vi.fn().mockResolvedValue([wireRide("r1", "ACCEPTED")]),
    });

    expect((await service.acceptedAssignments()).size).toBe(0);
  });
});
