import type { DriverAvailability, RideDriver } from "../models/RideDriver";
import { toCarDriver } from "./CarMapper";

const STATUSES = ["ACTIVE", "DISABLED"] as const;

const AVAILABILITIES: readonly DriverAvailability[] = [
  "AVAILABLE",
  "BUSY",
  "OFFLINE",
];

/** Reads an account as a driver; availability is optional because older responses omit it. */
export function toRideDriver(raw: unknown): RideDriver {
  const driver = toCarDriver(raw);
  const record =
    typeof raw === "object" && raw !== null
      ? (raw as Record<string, unknown>)
      : {};

  return {
    ...driver,
    availability: AVAILABILITIES.find(
      (candidate) => candidate === record.availability,
    ),
    status: STATUSES.find((candidate) => candidate === record.status),
  };
}

export function toRideDrivers(raw: unknown): RideDriver[] {
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected driver list response");
  }

  return raw.map(toRideDriver);
}
