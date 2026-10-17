import { useEffect, useState } from "react";
import { toApiFailure } from "../../../common/domain/mappers/ApiFailureMapper";
import type { ApiFailureKind } from "../../../common/domain/models/ApiFailure";
import { Icon } from "../../../common/ui/components/Icon";
import { Modal } from "../../../common/ui/components/Modal";
import { PendingButton } from "../../../common/ui/components/PendingButton";
import { useApiAction } from "../../../common/ui/hooks/useApiAction";
import { useLatest } from "../../../common/ui/hooks/useLatest";
import { driverName } from "../../domain/models/Car";
import { rideNumber, type Ride } from "../../domain/models/Ride";
import { driverInitials, type RideDriver } from "../../domain/models/RideDriver";
import { blockingRideId } from "../../domain/services/RideActionService";
import type { RideApi } from "../../domain/services/RideService";
import {
  ridesCopy,
  rideFailureText,
  STALE_FAILURES,
} from "../assets/rideCopy";
import { AvailabilityLabel } from "./RideBadges";
import { RideSummary } from "./RideSummary";

type Loaded =
  | { status: "loading" }
  | { status: "failed" }
  | {
      status: "ready";
      drivers: RideDriver[];
      held: ReadonlyMap<string, string>;
    };

interface AssignDriverDialogProps {
  ride: Ride;
  rides: Pick<RideApi, "drivers" | "acceptedAssignments">;
  /** Rejects when the API does not confirm the assignment. */
  onAssign: (driver: RideDriver) => Promise<void>;
  onReload: () => void;
  onClose: () => void;
  onUnauthenticated: () => void;
}

/** Assignment has its own wording for a conflict and for an account that cannot drive. */
function assignFailureText(kind: ApiFailureKind): string {
  switch (kind) {
    case "conflict": {
      return ridesCopy.assign.conflict;
    }

    case "invalid": {
      return ridesCopy.assign.invalid;
    }

    default: {
      return rideFailureText[kind];
    }
  }
}

function matches(driver: RideDriver, text: string): boolean {
  const words = text.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [driver.firstName, driver.lastName, driver.email]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return words.every((word) => haystack.includes(word));
}

/**
 * Picks the driver for a ride. Availability is shown for information only; the one hard rule is
 * that a driver already holding an accepted ride cannot take another, so those rows are disabled
 * with the reason beside them.
 */
export function AssignDriverDialog({
  ride,
  rides,
  onAssign,
  onReload,
  onClose,
  onUnauthenticated,
}: AssignDriverDialogProps) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [text, setText] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const action = useApiAction(onUnauthenticated);
  const expired = useLatest(onUnauthenticated);
  const kind = action.failure?.kind;
  const reassign = Boolean(ride.driverId);

  useEffect(() => {
    const controller = new AbortController();

    setLoaded({ status: "loading" });

    Promise.all([
      rides.drivers(controller.signal),
      rides.acceptedAssignments(controller.signal),
    ])
      .then(([drivers, held]) => {
        if (!controller.signal.aborted) {
          setLoaded({ status: "ready", drivers, held });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setLoaded({ status: "failed" });

        if (toApiFailure(error).kind === "unauthenticated") {
          expired.current();
        }
      });

    return () => controller.abort();
  }, [rides, attempt, expired]);

  // Disabled accounts stay in the directory for names but cannot be assigned.
  const visible =
    loaded.status === "ready"
      ? loaded.drivers.filter(
          (driver) => driver.status !== "DISABLED" && matches(driver, text),
        )
      : [];
  // A selection the search has filtered out is not submitted.
  const selected = visible.find((driver) => driver.id === selectedId);
  const current =
    loaded.status === "ready"
      ? loaded.drivers.find((driver) => driver.id === ride.driverId)
      : undefined;

  return (
    <Modal
      title={reassign ? ridesCopy.assign.reassignTitle : ridesCopy.assign.title}
      onClose={onClose}
      busy={action.pending}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();

          if (selected) {
            void action.run(() => onAssign(selected));
          }
        }}
      >
        <div className="modal-body">
          <div className="modal-content">
            <div className="summary-card">
              <RideSummary ride={ride} />
              {current && (
                <span className="muted">
                  {ridesCopy.assign.currentDriver}: {driverName(current)}
                </span>
              )}
            </div>

            <div className="search">
              <Icon name="search" size={18} />
              <input
                type="search"
                aria-label={ridesCopy.assign.searchLabel}
                placeholder={ridesCopy.assign.searchPlaceholder}
                maxLength={100}
                autoComplete="off"
                disabled={loaded.status !== "ready"}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </div>

            {loaded.status === "loading" && (
              <p className="state-line" role="status">
                <span className="spinner" aria-hidden="true" />
                {ridesCopy.assign.loading}
              </p>
            )}
            {loaded.status === "failed" && (
              <div className="banner error with-action" role="alert">
                <span>{ridesCopy.assign.failed}</span>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setAttempt((count) => count + 1)}
                >
                  {ridesCopy.assign.retry}
                </button>
              </div>
            )}
            {loaded.status === "ready" && visible.length === 0 && (
              <p className="muted">{ridesCopy.assign.none}</p>
            )}
            {loaded.status === "ready" && visible.length > 0 && (
              <fieldset className="driver-picker">
                <legend className="sr-only">{ridesCopy.assign.listLabel}</legend>
                {visible.map((driver) => {
                  const blocking = blockingRideId(driver.id, ride, loaded.held);
                  const isCurrent = driver.id === ride.driverId;
                  const reasonId = `assign-${driver.id}-reason`;

                  return (
                    <label
                      key={driver.id}
                      className={`driver-option ${
                        selectedId === driver.id ? "selected" : ""
                      } ${blocking || isCurrent ? "disabled" : ""}`}
                    >
                      <input
                        type="radio"
                        name="assign-driver"
                        value={driver.id}
                        disabled={Boolean(blocking) || isCurrent || action.pending}
                        checked={selectedId === driver.id}
                        aria-describedby={blocking ? reasonId : undefined}
                        onChange={() => setSelectedId(driver.id)}
                      />
                      <span className="avatar small" aria-hidden="true">
                        {driverInitials(driver)}
                      </span>
                      <span className="driver-option-text">
                        <strong>{driverName(driver)}</strong>
                        <span className="muted">{driver.email}</span>
                      </span>
                      <span className="driver-option-state">
                        {driver.availability && (
                          <AvailabilityLabel
                            availability={driver.availability}
                          />
                        )}
                        {isCurrent && (
                          <span className="tag">
                            {ridesCopy.assign.currentDriver}
                          </span>
                        )}
                        {blocking && (
                          <span className="reason" id={reasonId}>
                            <Icon name="alert" size={16} />
                            {ridesCopy.assign.holdsRide(rideNumber(blocking))}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}

            <p className="note info">
              <Icon name="lock" size={18} />
              {ridesCopy.assign.availabilityNote}
            </p>

            {kind && (
              <div className="banner error with-action" role="alert">
                <span>
                  {assignFailureText(kind)}
                </span>
                {STALE_FAILURES.includes(kind) && (
                  <button type="button" className="btn" onClick={onReload}>
                    {ridesCopy.reload}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <footer className="modal-foot">
          <button
            type="button"
            className="btn"
            disabled={action.pending}
            onClick={onClose}
          >
            {ridesCopy.cancel}
          </button>
          <PendingButton
            type="submit"
            className="btn primary"
            pending={action.pending}
            pendingLabel={ridesCopy.assign.pending}
            disabled={!selected}
          >
            {selected
              ? ridesCopy.assign.submit(driverName(selected))
              : ridesCopy.assign.title}
          </PendingButton>
        </footer>
      </form>
    </Modal>
  );
}
