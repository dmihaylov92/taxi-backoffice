import type { CarDraft, DraftErrors, DraftField } from "../models/CarDraft";

const MAX_PLATE_LENGTH = 20;
const MAX_TEXT_LENGTH = 50;
const PLATE = /^[\p{L}\p{N}-]+$/u;
const VIN = /^[A-HJ-NPR-Z0-9]{17}$/;
const MILEAGE = /^\d{1,7}$/;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;

function isValidText(value: string): boolean {
  const trimmed = value.trim();

  return (
    trimmed.length <= MAX_TEXT_LENGTH && !CONTROL_CHARACTERS.test(trimmed)
  );
}

/** Mirrors the API policy so that obvious mistakes are caught before a request is sent. */
export function validateDraft(
  draft: CarDraft,
  fields: readonly DraftField[],
): DraftErrors {
  const errors: DraftErrors = {};

  for (const field of fields) {
    switch (field) {
      case "plate": {
        const plate = draft.plate.replace(/\s+/g, "");

        if (plate.length === 0) {
          errors.plate = "plateRequired";
        } else if (plate.length > MAX_PLATE_LENGTH || !PLATE.test(plate)) {
          errors.plate = "plateInvalid";
        }

        break;
      }

      case "make":
      case "model": {
        if (!isValidText(draft[field])) {
          errors[field] = "textTooLong";
        }

        break;
      }

      case "vin": {
        const vin = draft.vin.trim().toUpperCase();

        if (vin.length > 0 && !VIN.test(vin)) {
          errors.vin = "vinInvalid";
        }

        break;
      }

      case "mileageKm": {
        const mileage = draft.mileageKm.trim();

        if (mileage.length > 0 && !MILEAGE.test(mileage)) {
          errors.mileageKm = "mileageInvalid";
        }

        break;
      }
    }
  }

  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.keys(errors).length > 0;
}
