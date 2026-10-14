import type { RideStatus } from "./Ride";

/**
 * The ride list can only be narrowed by status; the API has no text, type or driver filters yet.
 * An absent status means "no restriction".
 */
export interface RideFilters {
  status?: RideStatus;
}

export const NO_RIDE_FILTERS: RideFilters = {};
