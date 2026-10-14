import { driverName } from "../../domain/models/Car";
import type { Ride } from "../../domain/models/Ride";
import { driverInitials, type RideDriver } from "../../domain/models/RideDriver";
import { ridesCopy } from "../assets/rideCopy";
import { AvailabilityLabel } from "./RideBadges";

interface RideDriverCellProps {
  ride: Ride;
  drivers: ReadonlyMap<string, RideDriver>;
}

/**
 * The ride's driver with read-only availability. A ride without a driver and a driver the lookup
 * cannot resolve are both ordinary states, shown as muted labels rather than errors.
 */
export function RideDriverCell({ ride, drivers }: RideDriverCellProps) {
  if (!ride.driverId) {
    return <span className="muted">{ridesCopy.noDriver}</span>;
  }

  const driver = drivers.get(ride.driverId);

  if (!driver) {
    return <span className="muted">{ridesCopy.driverUnknown}</span>;
  }

  return (
    <span className="driver-cell">
      <span className="avatar small" aria-hidden="true">
        {driverInitials(driver)}
      </span>
      <span className="driver-cell-text">
        <span>{driverName(driver)}</span>
        {driver.availability && (
          <AvailabilityLabel availability={driver.availability} />
        )}
      </span>
    </span>
  );
}
