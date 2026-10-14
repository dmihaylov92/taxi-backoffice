/**
 * Ride features the screens are built for but the API cannot carry yet. The UI keeps the matching
 * controls and columns disabled or hidden until the service reports the capability, so enabling one
 * is a contract change in one place rather than a UI rewrite.
 */
export interface RideCapabilities {
  /** Rides return and accept a `type`; business rides carry a planned period. */
  rideType: boolean;
  /** Rides return `estimatedDistanceKm`. */
  estimatedDistance: boolean;
  /** Create accepts an optional driver. */
  driverOnCreate: boolean;
  /** The server notifies the driver when their ride is rejected or its addresses change. */
  driverNotifications: boolean;
}

export const NO_RIDE_CAPABILITIES: RideCapabilities = {
  rideType: false,
  estimatedDistance: false,
  driverOnCreate: false,
  driverNotifications: false,
};

/** Dispatcher operations the API can perform; derived from which service methods exist. */
export interface RideOperations {
  assign: boolean;
  reopen: boolean;
}
