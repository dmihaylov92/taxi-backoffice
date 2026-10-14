import {
  PHONE_PREFIX,
  type RideDraft,
  type RideDraftErrors,
  type RideDraftField,
} from "../models/RideDraft";
import { isValidNationalNumber } from "./RidePhoneService";

const MAX_ADDRESS_LENGTH = 200;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;

/** A blank phone or address is only an error for the type that requires it. */
function validatePhone(draft: RideDraft, required: boolean): RideDraftErrors {
  const typed = draft.phone.trim();

  if (typed === "" || typed === PHONE_PREFIX) {
    return required ? { phone: "phoneRequired" } : {};
  }

  return isValidNationalNumber(typed) ? {} : { phone: "phoneInvalid" };
}

function validateAddress(
  value: string,
  field: "pickupAddress" | "destinationAddress",
  required: boolean,
): RideDraftErrors {
  const address = value.trim();

  if (address.length === 0) {
    if (!required) {
      return {};
    }

    return {
      [field]: field === "pickupAddress" ? "pickupRequired" : "destinationRequired",
    };
  }

  if (address.length > MAX_ADDRESS_LENGTH) {
    return { [field]: "addressTooLong" };
  }

  return CONTROL_CHARACTERS.test(address) ? { [field]: "addressInvalid" } : {};
}

function validatePeriod(draft: RideDraft): RideDraftErrors {
  if (!draft.plannedFrom || !draft.plannedTo) {
    return {};
  }

  // `datetime-local` values are fixed-width ISO strings, so they order lexicographically.
  return draft.plannedTo > draft.plannedFrom ? {} : { plannedTo: "periodInvalid" };
}

/**
 * Catches obvious mistakes before a request is sent. A normal ride needs the customer's phone and
 * both addresses (the API enforces the same). The business rules are provisional: the contract
 * has no business ride yet, so a driver being required and the period ordering are assumptions
 * from the domain docs to be confirmed when it does.
 */
export function validateDraft(draft: RideDraft): RideDraftErrors {
  const business = draft.type === "BUSINESS";
  const errors: RideDraftErrors = {
    ...validatePhone(draft, !business),
    ...validateAddress(draft.pickupAddress, "pickupAddress", !business),
    ...validateAddress(draft.destinationAddress, "destinationAddress", !business),
  };

  if (business) {
    if (!draft.driverId) {
      errors.driverId = "driverRequired";
    }

    Object.assign(errors, validatePeriod(draft));
  }

  return errors;
}

/** The first field in form order that has an error, for moving focus to it. */
export function firstErrorField(
  errors: RideDraftErrors,
  order: readonly RideDraftField[],
): RideDraftField | undefined {
  return order.find((field) => errors[field]);
}

export function hasErrors(errors: RideDraftErrors): boolean {
  return Object.keys(errors).length > 0;
}
