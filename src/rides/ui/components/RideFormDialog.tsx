import { useState, type FormEvent, type ReactNode } from "react";
import { AddressAutocomplete } from "../../../common/ui/components/AddressAutocomplete";
import { Field } from "../../../common/ui/components/Field";
import { Icon } from "../../../common/ui/components/Icon";
import { Modal } from "../../../common/ui/components/Modal";
import { PendingButton } from "../../../common/ui/components/PendingButton";
import { useApiAction } from "../../../common/ui/hooks/useApiAction";
import { useRejectedFields } from "../../../common/ui/hooks/useRejectedFields";
import { driverName } from "../../domain/models/Car";
import { rideNumber, type Ride, type RideType } from "../../domain/models/Ride";
import type { RideCapabilities } from "../../domain/models/RideCapabilities";
import {
  PHONE_PREFIX,
  type RideDraft,
  type RideDraftErrors,
  type RideDraftField,
} from "../../domain/models/RideDraft";
import type { RideDriver } from "../../domain/models/RideDriver";
import { RIDE_REJECTED_FIELDS } from "../../domain/models/RideRejectedFields";
import { formatKm } from "../../domain/services/RideFormatService";
import {
  firstErrorField,
  hasErrors,
  validateDraft,
} from "../../domain/services/RideValidationService";
import {
  ridesCopy,
  rideDraftErrorText,
  rideFailureText,
  rideRejectedText,
  STALE_FAILURES,
} from "../assets/rideCopy";
import { AvailabilityLabel, RideStatusBadge, RideTypeBadge } from "./RideBadges";

interface RideFormDialogProps {
  mode: "create" | "edit";
  initial: RideDraft;
  /** The ride being edited; supplies its read-only status, driver and estimate. */
  ride?: Ride;
  drivers: ReadonlyMap<string, RideDriver>;
  capabilities: RideCapabilities;
  /** Whether a driver can be reassigned from the ride's own menu; only used for wording. */
  assignAvailable: boolean;
  /** Rejects when the API does not confirm the change; the dialog stays open and shows why. */
  onSubmit: (draft: RideDraft) => Promise<void>;
  /** The visible list is stale; the host reloads it and closes the dialog. */
  onReload: () => void;
  onClose: () => void;
  onUnauthenticated: () => void;
}

const FIELD_ORDER: readonly RideDraftField[] = [
  "phone",
  "pickupAddress",
  "destinationAddress",
  "driverId",
  "plannedTo",
];

const FIELD_IDS: Record<RideDraftField, string> = {
  phone: "ride-phone",
  pickupAddress: "ride-pickup",
  destinationAddress: "ride-destination",
  driverId: "ride-driver",
  plannedTo: "ride-planned-to",
};

function ReadOnlyField({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <span id={`${id}-label`} className="field-label">
        {label}
      </span>
      <div
        className="readonly-field"
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
      >
        <span>{children}</span>
        <Icon name="lock" size={16} />
      </div>
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

function TypeCards({
  value,
  businessAvailable,
  disabled,
  onChange,
}: {
  value: RideType;
  businessAvailable: boolean;
  disabled: boolean;
  onChange: (type: RideType) => void;
}) {
  return (
    <fieldset className="type-cards" disabled={disabled}>
      <legend className="sr-only">{ridesCopy.form.typeGroup}</legend>
      <label
        className={`type-card ${value === "NORMAL" ? "selected" : ""}`}
      >
        <input
          type="radio"
          name="ride-type"
          value="NORMAL"
          checked={value === "NORMAL"}
          onChange={() => onChange("NORMAL")}
        />
        <span className="type-card-head">
          <Icon name="phone" size={18} />
          <strong>{ridesCopy.form.normalTitle}</strong>
          <span className="type-mark" aria-hidden="true">
            {value === "NORMAL" && <Icon name="checkCircle" size={22} />}
          </span>
        </span>
        <span className="type-card-body">{ridesCopy.form.normalBody}</span>
      </label>
      <label
        className={`type-card ${value === "BUSINESS" ? "selected" : ""} ${
          businessAvailable ? "" : "unavailable"
        }`}
      >
        <input
          type="radio"
          name="ride-type"
          value="BUSINESS"
          checked={value === "BUSINESS"}
          disabled={!businessAvailable}
          onChange={() => onChange("BUSINESS")}
        />
        <span className="type-card-head">
          <Icon name="briefcase" size={18} />
          <strong>{ridesCopy.form.businessTitle}</strong>
          <span className="type-mark" aria-hidden="true">
            {value === "BUSINESS" && <Icon name="checkCircle" size={22} />}
          </span>
        </span>
        <span className="type-card-body">
          {businessAvailable
            ? ridesCopy.form.businessBody
            : ridesCopy.form.businessUnavailable}
        </span>
      </label>
    </fieldset>
  );
}

function DistanceRow({ distanceKm }: { distanceKm?: number }) {
  return (
    <div className="distance-row">
      <Icon name="route" size={20} />
      <div>
        <strong>{ridesCopy.form.distanceTitle}</strong>
        <p className="muted">{ridesCopy.form.distanceBody}</p>
      </div>
      <span className="distance-value">
        {distanceKm === undefined ? (
          <>
            <Icon name="clock" size={16} />
            {ridesCopy.form.distanceNone}
          </>
        ) : (
          ridesCopy.distanceKm(formatKm(distanceKm))
        )}
      </span>
    </div>
  );
}

/** Create and edit share one form: the same fields, validation and failure handling. */
export function RideFormDialog({
  mode,
  initial,
  ride,
  drivers,
  capabilities,
  assignAvailable,
  onSubmit,
  onReload,
  onClose,
  onUnauthenticated,
}: RideFormDialogProps) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<RideDraftErrors>({});
  const action = useApiAction(onUnauthenticated);
  const creating = mode === "create";
  const business = draft.type === "BUSINESS";
  const optional = ` (${ridesCopy.optional})`;
  const requiredMark = " *";
  const assignedDriver = ride?.driverId
    ? drivers.get(ride.driverId)
    : undefined;
  const failureKind = action.failure?.kind;
  const stale = failureKind && STALE_FAILURES.includes(failureKind);
  const assignedName = assignedDriver ? driverName(assignedDriver) : undefined;
  const activeDrivers = [...drivers.values()].filter(
    (driver) => driver.status !== "DISABLED",
  );

  const rejected = useRejectedFields({
    failure: action.failure,
    fieldMap: RIDE_REJECTED_FIELDS,
    order: FIELD_ORDER,
    ids: FIELD_IDS,
    messages: rideRejectedText,
  });

  function update(patch: Partial<RideDraft>, cleared?: RideDraftField) {
    setDraft((current) => ({ ...current, ...patch }));

    if (cleared) {
      rejected.dismiss(cleared);
    }

    if (cleared && errors[cleared]) {
      setErrors((current) => {
        const next = { ...current };

        delete next[cleared];

        return next;
      });
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (action.pending) {
      return;
    }

    const found = validateDraft(draft);

    if (!creating) {
      // The driver is read-only in an edit and never sent, so it cannot block saving.
      delete found.driverId;
    }

    setErrors(found);

    const first = firstErrorField(found, FIELD_ORDER);

    if (first) {
      document.getElementById(FIELD_IDS[first])?.focus();

      return;
    }

    await action.run(() => onSubmit(draft));
  }

  const phoneError = errors.phone
    ? rideDraftErrorText[errors.phone]
    : rejected.messageFor("phone");

  return (
    <Modal
      title={
        creating
          ? ridesCopy.create.title
          : ridesCopy.edit.title(ride ? rideNumber(ride.id) : "")
      }
      onClose={onClose}
      busy={action.pending}
    >
      <form
        className="ride-form"
        noValidate
        onSubmit={submit}
        aria-busy={action.pending}
      >
        <div className="modal-body">
          <div className="modal-content">
            {hasErrors(errors) && (
              <p className="banner error" role="alert">
                {creating
                  ? ridesCopy.create.failedSummary
                  : ridesCopy.edit.failedSummary}
              </p>
            )}

            {creating ? (
              <TypeCards
                value={draft.type}
                businessAvailable={capabilities.rideType}
                disabled={action.pending}
                onChange={(type) => {
                  setErrors({});
                  update({ type });
                }}
              />
            ) : (
              <div className="form-grid">
                {capabilities.rideType && ride?.type && (
                  <ReadOnlyField id="ride-type" label={ridesCopy.details.type}>
                    <RideTypeBadge type={ride.type} />
                  </ReadOnlyField>
                )}
                {ride && (
                  <ReadOnlyField
                    id="ride-status"
                    label={ridesCopy.details.status}
                  >
                    <RideStatusBadge status={ride.status} />
                  </ReadOnlyField>
                )}
              </div>
            )}

            {business && creating && (
              <div className="field">
                <label htmlFor={FIELD_IDS.driverId}>
                  {ridesCopy.form.driver}
                  {requiredMark}
                </label>
                <DriverSelect
                  id={FIELD_IDS.driverId}
                  value={draft.driverId}
                  drivers={activeDrivers}
                  required
                  disabled={action.pending}
                  error={errors.driverId && rideDraftErrorText[errors.driverId]}
                  onChange={(driverId) => update({ driverId }, "driverId")}
                />
                <p className="hint">{ridesCopy.form.driverHintBusiness}</p>
              </div>
            )}

            {business && (
              <div className="form-grid">
                <Field
                  id="ride-planned-from"
                  type="datetime-local"
                  icon={false}
                  label={`${ridesCopy.form.plannedFrom}${optional}`}
                  disabled={action.pending}
                  value={draft.plannedFrom}
                  onChange={(event) =>
                    update({ plannedFrom: event.target.value }, "plannedTo")
                  }
                />
                <Field
                  id={FIELD_IDS.plannedTo}
                  type="datetime-local"
                  icon={false}
                  label={`${ridesCopy.form.plannedTo}${optional}`}
                  disabled={action.pending}
                  value={draft.plannedTo}
                  error={
                    errors.plannedTo && rideDraftErrorText[errors.plannedTo]
                  }
                  onChange={(event) =>
                    update({ plannedTo: event.target.value }, "plannedTo")
                  }
                />
              </div>
            )}

            <div className="field">
              <label htmlFor={FIELD_IDS.phone}>
                {business ? ridesCopy.form.contactPhone : ridesCopy.form.phone}
                {business ? optional : requiredMark}
              </label>
              <div
                className={`phone-input ${phoneError ? "invalid" : ""}`}
              >
                <span className="phone-prefix">
                  <span className="sr-only">{ridesCopy.form.phonePrefix} </span>
                  {PHONE_PREFIX}
                </span>
                <input
                  id={FIELD_IDS.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  maxLength={24}
                  required={!business}
                  disabled={action.pending}
                  placeholder={ridesCopy.form.phonePlaceholder}
                  value={draft.phone}
                  aria-invalid={phoneError ? true : undefined}
                  aria-describedby={
                    phoneError
                      ? "ride-phone-hint ride-phone-error"
                      : "ride-phone-hint"
                  }
                  onChange={(event) =>
                    update({ phone: event.target.value }, "phone")
                  }
                />
              </div>
              <p className="hint" id="ride-phone-hint">
                {ridesCopy.form.phoneHint}
              </p>
              {phoneError && (
                <p className="error-text" id="ride-phone-error">
                  {phoneError}
                </p>
              )}
            </div>

            <AddressAutocomplete
              id={FIELD_IDS.pickupAddress}
              label={`${ridesCopy.form.pickup}${business ? optional : requiredMark}`}
              required={!business}
              disabled={action.pending}
              value={draft.pickupAddress}
              error={
                errors.pickupAddress
                  ? rideDraftErrorText[errors.pickupAddress]
                  : rejected.messageFor("pickupAddress")
              }
              onChange={(pickupAddress) =>
                update(
                  { pickupAddress, pickupCoordinates: undefined },
                  "pickupAddress",
                )
              }
              onSelect={({ label, coordinates }) =>
                update({
                  pickupAddress: label,
                  pickupCoordinates: coordinates,
                })
              }
            />
            <AddressAutocomplete
              id={FIELD_IDS.destinationAddress}
              label={`${ridesCopy.form.destination}${business ? optional : requiredMark}`}
              required={!business}
              disabled={action.pending}
              value={draft.destinationAddress}
              error={
                errors.destinationAddress
                  ? rideDraftErrorText[errors.destinationAddress]
                  : rejected.messageFor("destinationAddress")
              }
              onChange={(destinationAddress) =>
                update(
                  { destinationAddress, destinationCoordinates: undefined },
                  "destinationAddress",
                )
              }
              onSelect={({ label, coordinates }) =>
                update({
                  destinationAddress: label,
                  destinationCoordinates: coordinates,
                })
              }
            />

            {creating && !business && capabilities.driverOnCreate && (
              <div className="field">
                <label htmlFor={FIELD_IDS.driverId}>
                  {ridesCopy.form.driver}
                  {optional}
                </label>
                <DriverSelect
                  id={FIELD_IDS.driverId}
                  value={draft.driverId}
                  drivers={activeDrivers}
                  disabled={action.pending}
                  onChange={(driverId) => update({ driverId }, "driverId")}
                />
                <p className="hint">{ridesCopy.form.driverHintNormal}</p>
              </div>
            )}

            {!creating && ride?.driverId && (
              <ReadOnlyField
                id="ride-driver-readonly"
                label={ridesCopy.details.driver}
                hint={
                  assignAvailable
                    ? ridesCopy.edit.driverHint
                    : ridesCopy.edit.driverHintUnavailable
                }
              >
                {assignedDriver ? (
                  <>
                    {driverName(assignedDriver)}
                    {assignedDriver.availability && (
                      <>
                        {" · "}
                        <AvailabilityLabel
                          availability={assignedDriver.availability}
                        />
                      </>
                    )}
                  </>
                ) : (
                  ridesCopy.driverUnknown
                )}
              </ReadOnlyField>
            )}

            {(creating || capabilities.estimatedDistance) && (
              <DistanceRow distanceKm={ride?.estimatedDistanceKm} />
            )}

            {business && (
              <p className="note info">
                <Icon name="info" size={18} />
                {ridesCopy.form.businessNote}
              </p>
            )}

            {!creating && ride?.status === "ACCEPTED" && (
              <p className="note warning">
                <Icon name="info" size={18} />
                {capabilities.driverNotifications
                  ? ridesCopy.edit.addressNotice(assignedName)
                  : ridesCopy.edit.addressNoticeSilent(assignedName)}
              </p>
            )}

            {action.failure && (
              <div className="banner error with-action" role="alert">
                <span>{rideFailureText[action.failure.kind]}</span>
                {stale && (
                  <button
                    type="button"
                    className="btn"
                    onClick={onReload}
                  >
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
            pendingLabel={
              creating ? ridesCopy.create.pending : ridesCopy.edit.pending
            }
          >
            {creating ? ridesCopy.create.submit : ridesCopy.edit.submit}
          </PendingButton>
        </footer>
      </form>
    </Modal>
  );
}

function DriverSelect({
  id,
  value,
  drivers,
  required,
  disabled,
  error,
  onChange,
}: {
  id: string;
  value: string;
  drivers: readonly RideDriver[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  onChange: (driverId: string) => void;
}) {
  return (
    <>
      <select
        id={id}
        value={value}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{ridesCopy.form.noDriver}</option>
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driverName(driver)}
            {driver.availability
              ? ` · ${ridesCopy.availability[driver.availability]}`
              : ""}
          </option>
        ))}
      </select>
      {error && (
        <p className="error-text" id={`${id}-error`}>
          {error}
        </p>
      )}
    </>
  );
}
