import type { Ride, RideStatus } from "../models/Ride";

/**
 * Dispatcher operations on one ride. `assign` covers both choosing the first driver and changing
 * the current one; the caller words it by whether a driver is held.
 */
export type RideAction =
  | "view"
  | "edit"
  | "assign"
  | "broadcast"
  | "reject"
  | "reopen"
  | "remove";

/**
 * Operations offered in a list row. No status is a dead end: everything can be viewed, edited and
 * deleted, only pending and accepted rides can be assigned or reassigned (the others are reopened
 * first), only pending rides are sent to the drivers, rejection is hidden once a ride is
 * rejected, and only finished or rejected rides can be reopened.
 */
export function rowActions(status: RideStatus): RideAction[] {
  switch (status) {
    case "PENDING": {
      return ["view", "edit", "assign", "broadcast", "reject", "remove"];
    }

    case "ACCEPTED": {
      return ["view", "edit", "assign", "reject", "remove"];
    }

    case "FINISHED": {
      return ["view", "edit", "reject", "reopen", "remove"];
    }

    case "REJECTED": {
      return ["view", "edit", "reopen", "remove"];
    }
  }
}

/** The shorter set of secondary operations in the details footer; editing is always primary there. */
export function detailActions(status: RideStatus): RideAction[] {
  switch (status) {
    case "PENDING": {
      return ["assign", "broadcast", "reject"];
    }

    case "ACCEPTED": {
      return ["assign", "reject"];
    }

    case "FINISHED":
    case "REJECTED": {
      return ["reopen"];
    }
  }
}

/**
 * The accepted ride that stops `driverId` from taking `ride`, if any. A driver holds at most one
 * accepted ride, so one they already hold elsewhere blocks the assignment; the ride being
 * assigned does not block its own current driver.
 */
export function blockingRideId(
  driverId: string,
  ride: Ride,
  acceptedByDriver: ReadonlyMap<string, string>,
): string | undefined {
  const held = acceptedByDriver.get(driverId);

  return held && held !== ride.id ? held : undefined;
}
