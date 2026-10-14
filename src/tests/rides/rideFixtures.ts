import { vi } from "vitest";
import type { Ride } from "../../rides/domain/models/Ride";
import { NO_RIDE_CAPABILITIES } from "../../rides/domain/models/RideCapabilities";
import type { RideDriver } from "../../rides/domain/models/RideDriver";
import type { RideApi } from "../../rides/domain/services/RideService";

/** Object-id style identifiers whose last six characters are the displayed ride number. */
export const pendingRide: Ride = {
  id: "aaaaaaaaaaaaaaaaaa001048",
  status: "PENDING",
  phoneNumber: "+359888123456",
  pickupAddress: "ул. Димитър Благоев 12",
  destinationAddress: "ЖП гара Димитровград",
  dispatcherId: "acc-dispatcher",
  createdAt: "2026-08-14T10:24:00",
};

export const acceptedRide: Ride = {
  id: "aaaaaaaaaaaaaaaaaa001047",
  status: "ACCEPTED",
  phoneNumber: "+359877456789",
  pickupAddress: "бул. България 45",
  destinationAddress: "ул. Христо Ботев 8",
  driverId: "drv-ivan",
  dispatcherId: "acc-dispatcher",
  createdAt: "2026-08-14T10:11:00",
  acceptedAt: "2026-08-14T10:13:00",
};

export const finishedRide: Ride = {
  id: "aaaaaaaaaaaaaaaaaa001046",
  status: "FINISHED",
  phoneNumber: "+359899321654",
  pickupAddress: "ул. Георги Раковски 27",
  destinationAddress: "гр. Хасково, бул. Съединение 52",
  driverId: "drv-petar",
  dispatcherId: "someone-else",
  createdAt: "2026-08-14T09:42:00",
  acceptedAt: "2026-08-14T09:44:00",
  finishedAt: "2026-08-14T10:21:00",
};

export const rejectedRide: Ride = {
  id: "aaaaaaaaaaaaaaaaaa001045",
  status: "REJECTED",
  phoneNumber: "+359878654321",
  pickupAddress: "ул. Брегалница 3",
  destinationAddress: "бул. Македония 10",
  driverId: "drv-georgi",
  dispatcherId: "acc-dispatcher",
  createdAt: "2026-08-14T09:05:00",
};

/** A driver-recorded ride: no phone, addresses or dispatcher, and an unresolvable driver. */
export const externalRide: Ride = {
  id: "aaaaaaaaaaaaaaaaaa001043",
  status: "ACCEPTED",
  driverId: "drv-unknown",
  createdAt: "2026-08-13T14:52:00",
};

export const petar: RideDriver = {
  id: "drv-petar",
  email: "petar@taxi.test",
  firstName: "Петър",
  lastName: "Стоянов",
  availability: "AVAILABLE",
};

export const ivanDriver: RideDriver = {
  id: "drv-ivan",
  email: "ivan@taxi.test",
  firstName: "Иван",
  lastName: "Петров",
  availability: "BUSY",
};

export const georgiDriver: RideDriver = {
  id: "drv-georgi",
  email: "georgi@taxi.test",
  firstName: "Георги",
  lastName: "Димитров",
  availability: "OFFLINE",
};

export function rideApi(overrides: Partial<RideApi> = {}): RideApi {
  return {
    capabilities: NO_RIDE_CAPABILITIES,
    list: vi.fn().mockResolvedValue({
      items: [pendingRide, acceptedRide, finishedRide, rejectedRide],
      hasNext: false,
    }),
    create: vi.fn().mockResolvedValue({ ...pendingRide, id: "aaaaaaaaaaaaaaaaaa001049" }),
    update: vi.fn().mockResolvedValue(acceptedRide),
    reject: vi.fn().mockResolvedValue({ ...acceptedRide, status: "REJECTED" }),
    remove: vi.fn().mockResolvedValue(undefined),
    drivers: vi.fn().mockResolvedValue([petar, ivanDriver, georgiDriver]),
    acceptedAssignments: vi.fn().mockResolvedValue(new Map()),
    ...overrides,
  };
}
