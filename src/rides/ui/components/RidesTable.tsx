import { formatDateTime } from "../../../common/domain/services/DateFormatService";
import {
  RowMenu,
  type RowMenuItem,
} from "../../../common/ui/components/RowMenu";
import { rideNumber, type Ride } from "../../domain/models/Ride";
import type {
  RideCapabilities,
  RideOperations,
} from "../../domain/models/RideCapabilities";
import type { RideDriver } from "../../domain/models/RideDriver";
import {
  rowActions,
  type RideAction,
} from "../../domain/services/RideActionService";
import { formatKm } from "../../domain/services/RideFormatService";
import { formatPhone } from "../../domain/services/RidePhoneService";
import { ridesCopy } from "../assets/rideCopy";
import { RideDriverCell } from "./RideDriverCell";
import { RideStatusBadge, RideTypeBadge } from "./RideBadges";

interface RidesTableProps {
  rides: readonly Ride[];
  drivers: ReadonlyMap<string, RideDriver>;
  capabilities: RideCapabilities;
  operations: RideOperations;
  busy: boolean;
  onAction: (ride: Ride, action: RideAction) => void;
}

function menuItem(
  action: RideAction,
  ride: Ride,
  operations: RideOperations,
): RowMenuItem<RideAction> {
  switch (action) {
    case "view": {
      return { action, label: ridesCopy.menu.view, icon: "eye" };
    }

    case "edit": {
      return { action, label: ridesCopy.menu.edit, icon: "pencil" };
    }

    case "assign": {
      return {
        action,
        label: ride.driverId ? ridesCopy.menu.reassign : ridesCopy.menu.assign,
        icon: "userMove",
        disabledReason: operations.assign ? undefined : ridesCopy.unavailable,
      };
    }

    case "reject": {
      return {
        action,
        label: ridesCopy.menu.reject,
        icon: "ban",
        tone: "danger",
      };
    }

    case "reopen": {
      return {
        action,
        label: ridesCopy.menu.reopen,
        icon: "undo",
        disabledReason: operations.reopen ? undefined : ridesCopy.unavailable,
      };
    }

    case "remove": {
      return {
        action,
        label: ridesCopy.menu.remove,
        icon: "trash",
        tone: "danger",
        separated: true,
      };
    }
  }
}

export function RidesTable({
  rides,
  drivers,
  capabilities,
  operations,
  busy,
  onAction,
}: RidesTableProps) {
  return (
    <div className="table-wrap" aria-busy={busy}>
      <table className="data-table rides-table">
        <caption className="sr-only">{ridesCopy.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{ridesCopy.columns.number}</th>
            <th scope="col">{ridesCopy.columns.phone}</th>
            <th scope="col">{ridesCopy.columns.route}</th>
            {capabilities.rideType && (
              <th scope="col">{ridesCopy.columns.type}</th>
            )}
            <th scope="col">{ridesCopy.columns.status}</th>
            <th scope="col">{ridesCopy.columns.driver}</th>
            {capabilities.estimatedDistance && (
              <th scope="col" className="distance-col">
                {ridesCopy.columns.distance}
              </th>
            )}
            <th scope="col">{ridesCopy.columns.created}</th>
            <th scope="col" className="actions-col">
              <span className="sr-only">{ridesCopy.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rides.map((ride) => {
            const number = rideNumber(ride.id);

            return (
              <tr key={ride.id}>
                <th scope="row" className="ride-number">
                  {number}
                </th>
                <td className="phone-cell">
                  {ride.phoneNumber
                    ? formatPhone(ride.phoneNumber)
                    : ridesCopy.noValue}
                </td>
                <td className="route-cell">
                  {ride.pickupAddress || ride.destinationAddress ? (
                    <>
                      <span title={ride.pickupAddress}>
                        {ride.pickupAddress ?? ridesCopy.noValue}
                      </span>
                      <span
                        className="route-destination"
                        title={ride.destinationAddress}
                      >
                        → {ride.destinationAddress ?? ridesCopy.noValue}
                      </span>
                    </>
                  ) : (
                    <span className="muted">{ridesCopy.noAddresses}</span>
                  )}
                </td>
                {capabilities.rideType && (
                  <td>
                    {ride.type ? (
                      <RideTypeBadge type={ride.type} />
                    ) : (
                      ridesCopy.noValue
                    )}
                  </td>
                )}
                <td>
                  <RideStatusBadge status={ride.status} />
                </td>
                <td>
                  <RideDriverCell ride={ride} drivers={drivers} />
                </td>
                {capabilities.estimatedDistance && (
                  <td className="distance-cell">
                    {ride.estimatedDistanceKm === undefined
                      ? ridesCopy.noValue
                      : ridesCopy.distanceKm(formatKm(ride.estimatedDistanceKm))}
                  </td>
                )}
                <td className="date-cell">
                  {(ride.createdAt && formatDateTime(ride.createdAt)) ||
                    ridesCopy.noValue}
                </td>
                <td className="actions-col">
                  <RowMenu
                    triggerLabel={ridesCopy.actionsFor(number)}
                    items={rowActions(ride.status).map((action) =>
                      menuItem(action, ride, operations),
                    )}
                    onSelect={(action) => onAction(ride, action)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
