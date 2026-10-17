import { useId, type ReactNode } from "react";
import { formatDateTime } from "../../../common/domain/services/DateFormatService";
import { Icon, type IconName } from "../../../common/ui/components/Icon";
import { Modal } from "../../../common/ui/components/Modal";
import { rideNumber, type Ride } from "../../domain/models/Ride";
import type {
  RideCapabilities,
  RideOperations,
} from "../../domain/models/RideCapabilities";
import type { RideDriver } from "../../domain/models/RideDriver";
import {
  detailActions,
  type RideAction,
} from "../../domain/services/RideActionService";
import { formatKm } from "../../domain/services/RideFormatService";
import { formatPhone } from "../../domain/services/RidePhoneService";
import { ridesCopy } from "../assets/rideCopy";
import { RideStatusBadge, RideTypeBadge } from "./RideBadges";
import { RideDriverCell } from "./RideDriverCell";

interface RideDetailsDialogProps {
  ride: Ride;
  drivers: ReadonlyMap<string, RideDriver>;
  capabilities: RideCapabilities;
  operations: RideOperations;
  /** Used to word the dispatcher row; the API returns only an account id. */
  currentUserId: string;
  onAction: (action: RideAction) => void;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function muted(text: string) {
  return <span className="muted">{text}</span>;
}

function dateTime(iso: string | undefined) {
  return (iso && formatDateTime(iso)) || ridesCopy.noValue;
}

function period(ride: Ride) {
  const from = ride.plannedFrom && formatDateTime(ride.plannedFrom);
  const to = ride.plannedTo && formatDateTime(ride.plannedTo);

  if (!from && !to) {
    return ridesCopy.noValue;
  }

  return `${from || ridesCopy.noValue} – ${to || ridesCopy.noValue}`;
}

function dispatcherLabel(ride: Ride, currentUserId: string) {
  if (!ride.dispatcherId) {
    return muted(ridesCopy.details.noDispatcher);
  }

  return ride.dispatcherId === currentUserId
    ? ridesCopy.details.you
    : ridesCopy.details.otherDispatcher;
}

/** Read-only view of one ride; empty values are normal states, never errors. */
export function RideDetailsDialog({
  ride,
  drivers,
  capabilities,
  operations,
  currentUserId,
  onAction,
  onClose,
}: RideDetailsDialogProps) {
  const actions = detailActions(ride.status);
  const reasonId = useId();

  function secondary(action: RideAction, icon: IconName, label: string) {
    const unavailable =
      (action === "assign" && !operations.assign) ||
      (action === "broadcast" && !operations.broadcast) ||
      (action === "reopen" && !operations.reopen);

    return (
      <button
        type="button"
        className={`btn ${action === "reject" ? "danger-outline" : ""}`}
        aria-disabled={unavailable ? true : undefined}
        aria-describedby={unavailable ? reasonId : undefined}
        onClick={() => {
          if (!unavailable) {
            onAction(action);
          }
        }}
      >
        <Icon name={icon} size={18} />
        {label}
        {unavailable && (
          <span id={reasonId} hidden>
            {ridesCopy.unavailable}
          </span>
        )}
      </button>
    );
  }

  return (
    <Modal title={ridesCopy.details.title} onClose={onClose}>
      <div className="modal-body">
        <dl className="detail-list">
          <Row label={ridesCopy.details.number}>
            <strong>{rideNumber(ride.id)}</strong>
          </Row>
          <Row label={ridesCopy.details.status}>
            <RideStatusBadge status={ride.status} />
          </Row>
          {capabilities.rideType && (
            <Row label={ridesCopy.details.type}>
              {ride.type ? (
                <RideTypeBadge type={ride.type} />
              ) : (
                ridesCopy.noValue
              )}
            </Row>
          )}
          <Row label={ridesCopy.details.phone}>
            {ride.phoneNumber
              ? formatPhone(ride.phoneNumber)
              : muted(ridesCopy.details.noPhone)}
          </Row>
          <Row label={ridesCopy.details.pickup}>
            {ride.pickupAddress ?? muted(ridesCopy.details.noAddress)}
          </Row>
          <Row label={ridesCopy.details.destination}>
            {ride.destinationAddress ?? muted(ridesCopy.details.noAddress)}
          </Row>
          {capabilities.estimatedDistance && (
            <Row label={ridesCopy.details.distance}>
              {ride.estimatedDistanceKm === undefined
                ? muted(ridesCopy.details.noDistance)
                : ridesCopy.distanceKm(formatKm(ride.estimatedDistanceKm))}
            </Row>
          )}
          {capabilities.rideType && ride.type === "BUSINESS" && (
            <Row label={ridesCopy.details.period}>{period(ride)}</Row>
          )}
          <Row label={ridesCopy.details.driver}>
            <RideDriverCell ride={ride} drivers={drivers} />
          </Row>
          <Row label={ridesCopy.details.dispatcher}>
            {dispatcherLabel(ride, currentUserId)}
          </Row>
          <Row label={ridesCopy.details.createdAt}>
            {dateTime(ride.createdAt)}
          </Row>
          <Row label={ridesCopy.details.acceptedAt}>
            {dateTime(ride.acceptedAt)}
          </Row>
          <Row label={ridesCopy.details.finishedAt}>
            {dateTime(ride.finishedAt)}
          </Row>
        </dl>
      </div>
      <footer className="modal-foot details-foot">
        <div className="details-secondary">
          {actions.includes("assign") &&
            secondary(
              "assign",
              "userMove",
              ride.driverId ? ridesCopy.menu.reassign : ridesCopy.menu.assign,
            )}
          {actions.includes("broadcast") &&
            secondary("broadcast", "send", ridesCopy.menu.broadcast)}
          {actions.includes("reject") &&
            secondary("reject", "ban", ridesCopy.menu.reject)}
          {actions.includes("reopen") &&
            secondary("reopen", "undo", ridesCopy.menu.reopen)}
        </div>
        <button type="button" className="btn" onClick={onClose}>
          {ridesCopy.close}
        </button>
        <button
          type="button"
          className="btn primary"
          onClick={() => onAction("edit")}
        >
          <Icon name="pencil" size={18} />
          {ridesCopy.details.edit}
        </button>
      </footer>
    </Modal>
  );
}
