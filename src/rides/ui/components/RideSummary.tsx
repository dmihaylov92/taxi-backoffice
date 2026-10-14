import { formatPhone } from "../../domain/services/RidePhoneService";
import { rideNumber, type Ride } from "../../domain/models/Ride";
import { ridesCopy } from "../assets/rideCopy";

/** Number, phone and route of a ride, for confirmations that must name what they act on. */
export function RideSummary({ ride }: { ride: Ride }) {
  const route = [ride.pickupAddress, ride.destinationAddress]
    .filter(Boolean)
    .join(" → ");

  return (
    <div className="ride-summary">
      <strong>
        {ridesCopy.numberLabel(rideNumber(ride.id))} ·{" "}
        {ride.phoneNumber ? formatPhone(ride.phoneNumber) : ridesCopy.noValue}
      </strong>
      <span className={route ? undefined : "muted"}>
        {route || ridesCopy.noAddresses}
      </span>
    </div>
  );
}
