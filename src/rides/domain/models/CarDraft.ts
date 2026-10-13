/** Editable car fields exactly as typed; everything except the plate is optional and may be blank. */
export interface CarDraft {
  plate: string;
  make: string;
  model: string;
  vin: string;
  /** Digits as typed; converted to a number when sent. */
  mileageKm: string;
  /** `yyyy-MM-dd` as produced by a date input, or empty. */
  servicedAt: string;
}

export type DraftField = "plate" | "make" | "model" | "vin" | "mileageKm";

export type DraftErrorKind =
  | "plateRequired"
  | "plateInvalid"
  | "textTooLong"
  | "vinInvalid"
  | "mileageInvalid";

export type DraftErrors = Partial<Record<DraftField, DraftErrorKind>>;

export const EMPTY_CAR_DRAFT: CarDraft = {
  plate: "",
  make: "",
  model: "",
  vin: "",
  mileageKm: "",
  servicedAt: "",
};
