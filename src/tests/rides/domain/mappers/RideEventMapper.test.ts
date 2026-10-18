import { describe, expect, it } from "vitest";
import { toRideEvent } from "../../../../rides/domain/mappers/RideEventMapper";

const ride = {
  id: "aaaaaaaaaaaaaaaaaa001048",
  status: "ACCEPTED",
  phoneNumber: "+359888123456",
  pickupAddress: "ул. Марица 5",
  driverId: "drv-ivan",
  updatedAt: "2026-08-14T10:24:00Z",
};

describe("toRideEvent", () => {
  it("reads the full ride of a ride.updated event", () => {
    const event = toRideEvent("ride.updated", JSON.stringify({ ride }));

    expect(event).toEqual({
      type: "updated",
      ride: expect.objectContaining({
        id: ride.id,
        status: "ACCEPTED",
        pickupAddress: "ул. Марица 5",
        driverId: "drv-ivan",
      }),
    });
  });

  it("reads the id of a ride.deleted event", () => {
    expect(toRideEvent("ride.deleted", '{"id":"abc"}')).toEqual({
      type: "deleted",
      id: "abc",
    });
  });

  it.each([
    ["not json", "ride.updated", "{"],
    ["a non-object payload", "ride.updated", "42"],
    ["a payload without a ride", "ride.updated", "{}"],
    ["a ride with an unknown status", "ride.updated", '{"ride":{"id":"a","status":"LOST"}}'],
    ["a ride without an id", "ride.updated", '{"ride":{"status":"PENDING"}}'],
    ["a deletion without an id", "ride.deleted", "{}"],
    ["a deletion with an empty id", "ride.deleted", '{"id":""}'],
    ["a deletion that is not an object", "ride.deleted", "null"],
    ["an unknown event", "ride.offered", '{"ride":{"id":"a","status":"PENDING"}}'],
  ])("drops %s", (_name, type, data) => {
    expect(toRideEvent(type, data)).toBeUndefined();
  });
});
