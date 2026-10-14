import { useId } from "react";
import { Icon } from "../../../common/ui/components/Icon";
import { RIDE_STATUSES, type RideStatus } from "../../domain/models/Ride";
import { ridesCopy } from "../assets/rideCopy";

interface RidesToolbarProps {
  status?: RideStatus;
  onStatusChange: (status?: RideStatus) => void;
}

/**
 * Status is the only filter the API supports. Search, type and driver filters keep their place in
 * the design but stay disabled, with the reason attached, until the API can serve them.
 */
export function RidesToolbar({ status, onStatusChange }: RidesToolbarProps) {
  const noteId = useId();

  return (
    <div className="toolbar rides-toolbar" role="search">
      <div className="search">
        <Icon name="search" size={18} />
        <input
          type="search"
          aria-label={ridesCopy.searchLabel}
          aria-describedby={noteId}
          placeholder={ridesCopy.searchPlaceholder}
          disabled
        />
      </div>
      <select
        aria-label={ridesCopy.statusFilter}
        value={status ?? ""}
        onChange={(event) =>
          onStatusChange(
            RIDE_STATUSES.find((value) => value === event.target.value),
          )
        }
      >
        <option value="">{ridesCopy.allStatuses}</option>
        {RIDE_STATUSES.map((value) => (
          <option key={value} value={value}>
            {ridesCopy.statuses[value]}
          </option>
        ))}
      </select>
      <select
        aria-label={ridesCopy.typeFilter}
        aria-describedby={noteId}
        disabled
      >
        <option>{ridesCopy.allTypes}</option>
      </select>
      <select
        aria-label={ridesCopy.driverFilter}
        aria-describedby={noteId}
        disabled
      >
        <option>{ridesCopy.allDrivers}</option>
      </select>
      <p id={noteId} className="sr-only">
        {ridesCopy.filtersSoon}
      </p>
    </div>
  );
}
