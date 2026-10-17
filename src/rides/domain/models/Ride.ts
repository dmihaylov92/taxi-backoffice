import type { Coordinates } from "../../../common/domain/models/Coordinates";

export type RideStatus = "PENDING" | "ACCEPTED" | "FINISHED" | "REJECTED";

export const RIDE_STATUSES: readonly RideStatus[] = [
  "PENDING",
  "ACCEPTED",
  "FINISHED",
  "REJECTED",
];

/** `NORMAL` is offered to drivers; `BUSINESS` is a manually assigned contract-work record. */
export type RideType = "NORMAL" | "BUSINESS";

export const RIDE_TYPES: readonly RideType[] = ["NORMAL", "BUSINESS"];

/**
 * A taxi work record. Everything except the id and status is optional: rides recorded by drivers
 * have no phone, addresses or dispatcher, and an account deletion clears the driver reference.
 * The type, estimate and planned period are not part of the API yet; they stay empty until it
 * returns them.
 */
export interface Ride {
  id: string;
  status: RideStatus;
  phoneNumber?: string;
  pickupAddress?: string;
  destinationAddress?: string;
  /** Where the addresses are, when they were chosen from the address search. */
  pickupCoordinates?: Coordinates;
  destinationCoordinates?: Coordinates;
  driverId?: string;
  dispatcherId?: string;
  /** ISO timestamps. */
  createdAt?: string;
  updatedAt?: string;
  acceptedAt?: string;
  finishedAt?: string;
  type?: RideType;
  /** Informational driving-route estimate in kilometres; not a price or an actual mileage. */
  estimatedDistanceKm?: number;
  /** ISO timestamps of the planned service period of a business ride. */
  plannedFrom?: string;
  plannedTo?: string;
}

const NUMBER_LENGTH = 6;

/**
 * The API has no sequential ride number, so the tail of the identifier stands in for it; the
 * trailing characters of a Mongo object id are its per-process counter and differ between rides.
 */
export function rideNumber(id: string): string {
  return id.slice(-NUMBER_LENGTH).toUpperCase();
}
