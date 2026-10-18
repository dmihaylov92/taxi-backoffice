import type { Ride } from "./Ride";

/**
 * A change announced by the live stream. An update carries the full latest ride, so applying it
 * twice or out of order is harmless; a deleted ride has no state left, only its id.
 */
export type RideEvent =
  | { type: "updated"; ride: Ride }
  | { type: "deleted"; id: string };
