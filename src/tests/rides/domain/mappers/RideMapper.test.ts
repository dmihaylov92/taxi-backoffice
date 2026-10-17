import { describe, expect, it } from "vitest";
import {
  fromSearchParams,
  toDraft,
  toListQuery,
  toCreateBody,
  toRide,
  toRides,
  toSearchParams,
  toUpdateBody,
} from "../../../../rides/domain/mappers/RideMapper";
import { rideNumber } from "../../../../rides/domain/models/Ride";
import {
  EMPTY_RIDE_DRAFT,
  type RideDraft,
} from "../../../../rides/domain/models/RideDraft";

const wire = {
  id: "65f0c0ffee0000000000a1b2",
  phoneNumber: "+359888123456",
  pickupAddress: "ул. Димитър Благоев 12",
  destinationAddress: "ЖП гара Димитровград",
  status: "ACCEPTED",
  driverId: "drv-1",
  dispatcherId: "disp-1",
  createdAt: "2026-08-14T07:24:00Z",
  updatedAt: "2026-08-14T07:30:00Z",
  acceptedAt: "2026-08-14T07:25:00Z",
};

describe("RideMapper", () => {
  it("reads a ride and leaves unreturned fields undefined", () => {
    expect(toRide(wire)).toEqual({
      id: "65f0c0ffee0000000000a1b2",
      status: "ACCEPTED",
      phoneNumber: "+359888123456",
      pickupAddress: "ул. Димитър Благоев 12",
      destinationAddress: "ЖП гара Димитровград",
      driverId: "drv-1",
      dispatcherId: "disp-1",
      createdAt: "2026-08-14T07:24:00Z",
      updatedAt: "2026-08-14T07:30:00Z",
      acceptedAt: "2026-08-14T07:25:00Z",
      finishedAt: undefined,
      type: undefined,
      estimatedDistanceKm: undefined,
      plannedFrom: undefined,
      plannedTo: undefined,
    });
  });

  it("accepts a driver-recorded ride without phone, addresses or dispatcher", () => {
    const ride = toRide({ id: "r1", status: "ACCEPTED", driverId: "d1" });

    expect(ride.phoneNumber).toBeUndefined();
    expect(ride.pickupAddress).toBeUndefined();
    expect(ride.dispatcherId).toBeUndefined();
  });

  it("reads the type and estimate once the API returns them", () => {
    const ride = toRide({
      ...wire,
      type: "business",
      estimatedDistanceKm: 71.3,
    });

    expect(ride.type).toBe("BUSINESS");
    expect(ride.estimatedDistanceKm).toBe(71.3);
  });

  it("rejects malformed rides instead of showing them", () => {
    expect(() => toRide(null)).toThrow();
    expect(() => toRide({ status: "PENDING" })).toThrow();
    expect(() => toRide({ id: "r1", status: "DONE" })).toThrow();
    expect(() => toRides({})).toThrow();
  });

  it("numbers a ride by the tail of its identifier", () => {
    expect(rideNumber("65f0c0ffee0000000000a1b2")).toBe("00A1B2");
    expect(rideNumber("ab")).toBe("AB");
  });

  it("sends the phone as +359 and nine digits with trimmed addresses", () => {
    const draft: RideDraft = {
      ...EMPTY_RIDE_DRAFT,
      phone: "888 123 456",
      pickupAddress: "  ул. Димитър Благоев 12 ",
      destinationAddress: "ЖП гара ",
    };

    expect(toCreateBody(draft)).toEqual({
      phoneNumber: "+359888123456",
      pickupAddress: "ул. Димитър Благоев 12",
      destinationAddress: "ЖП гара",
    });
  });

  it("carries the coordinates of chosen places through the wire and the draft", () => {
    const ride = toRide({
      ...wire,
      pickupLatitude: 42.05,
      pickupLongitude: 25.6,
      destinationLatitude: 42.06,
    });

    expect(ride.pickupCoordinates).toEqual({ latitude: 42.05, longitude: 25.6 });
    expect(ride.destinationCoordinates).toBeUndefined();

    const draft = toDraft(ride);

    expect(toUpdateBody(draft)).toMatchObject({
      pickupLatitude: 42.05,
      pickupLongitude: 25.6,
    });
    expect(
      toUpdateBody({ ...draft, pickupCoordinates: undefined }).pickupLatitude,
    ).toBeUndefined();
  });

  it("does not double the country code of a pasted full number", () => {
    for (const typed of ["+359 888 123 456", "+359888123456", "888-123-456"]) {
      expect(toCreateBody({ ...EMPTY_RIDE_DRAFT, phone: typed }).phoneNumber).toBe(
        "+359888123456",
      );
    }
  });

  it("refuses to send a type or driver the API cannot store", () => {
    expect(() =>
      toCreateBody({ ...EMPTY_RIDE_DRAFT, type: "BUSINESS" }),
    ).toThrow();
    expect(() =>
      toCreateBody({ ...EMPTY_RIDE_DRAFT, driverId: "drv-1" }),
    ).toThrow();
  });

  it("never sends the read-only type or driver when updating", () => {
    const draft = toDraft(toRide({ ...wire, type: "business" }));

    expect(draft.driverId).toBe("drv-1");
    expect(toUpdateBody(draft)).toEqual({
      phoneNumber: "+359888123456",
      pickupAddress: "ул. Димитър Благоев 12",
      destinationAddress: "ЖП гара Димитровград",
    });
  });

  it("builds an edit draft with the phone after the prefix", () => {
    expect(toDraft(toRide(wire))).toEqual({
      type: "NORMAL",
      phone: "888123456",
      pickupAddress: "ул. Димитър Благоев 12",
      destinationAddress: "ЖП гара Димитровград",
      driverId: "drv-1",
      plannedFrom: "",
      plannedTo: "",
    });
  });

  it("builds an empty edit draft for a ride without phone or addresses", () => {
    const draft = toDraft(toRide({ id: "r1", status: "ACCEPTED" }));

    expect(draft.phone).toBe("");
    expect(draft.pickupAddress).toBe("");
  });

  it("builds the list query with status, page and size", () => {
    expect(toListQuery({}, 0, 20)).toBe("page=0&size=20");
    expect(toListQuery({ status: "PENDING" }, 2, 20)).toBe(
      "status=PENDING&page=2&size=20",
    );
  });

  it("round-trips list state through the address bar and ignores bad values", () => {
    const params = toSearchParams({ filters: { status: "FINISHED" }, page: 3 });

    expect(params.toString()).toBe("status=FINISHED&page=3");
    expect(fromSearchParams(params)).toEqual({
      filters: { status: "FINISHED" },
      page: 3,
    });
    expect(
      fromSearchParams(new URLSearchParams("status=BOGUS&page=-2")),
    ).toEqual({ filters: { status: undefined }, page: 0 });
  });
});
