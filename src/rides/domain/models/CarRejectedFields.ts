import type { FieldMap } from "../../../common/domain/mappers/ViolationMapper";
import type { DraftField } from "./CarDraft";

/** The form field that shows the refusal of each car request field; the names are the same. */
export const CAR_REJECTED_FIELDS: FieldMap<DraftField> = {
  plate: "plate",
  make: "make",
  model: "model",
  vin: "vin",
  mileageKm: "mileageKm",
};
