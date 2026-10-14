import { Icon, type IconName } from "../../../common/ui/components/Icon";
import type { RideStatus, RideType } from "../../domain/models/Ride";
import type { DriverAvailability } from "../../domain/models/RideDriver";
import { ridesCopy } from "../assets/rideCopy";

const STATUS_ICONS: Record<RideStatus, IconName> = {
  PENDING: "clock",
  ACCEPTED: "car",
  FINISHED: "checkCircle",
  REJECTED: "xCircle",
};

const TYPE_ICONS: Record<RideType, IconName> = {
  NORMAL: "phone",
  BUSINESS: "briefcase",
};

/** The label is always visible; the icon and tint only reinforce it. */
export function RideStatusBadge({ status }: { status: RideStatus }) {
  return (
    <span className={`badge ride-status ride-${status.toLowerCase()}`}>
      <Icon name={STATUS_ICONS[status]} size={14} />
      {ridesCopy.statuses[status]}
    </span>
  );
}

export function RideTypeBadge({ type }: { type: RideType }) {
  return (
    <span className={`badge ride-type ride-type-${type.toLowerCase()}`}>
      <Icon name={TYPE_ICONS[type]} size={14} />
      {ridesCopy.types[type]}
    </span>
  );
}

/** Read-only driver availability; a dispatcher never changes it. */
export function AvailabilityLabel({
  availability,
}: {
  availability: DriverAvailability;
}) {
  return (
    <span className="availability">
      <span
        className={`availability-dot ${availability.toLowerCase()}`}
        aria-hidden="true"
      />
      {ridesCopy.availability[availability]}
    </span>
  );
}
