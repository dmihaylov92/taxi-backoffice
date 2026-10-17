import type { FieldMap } from "../../../common/domain/mappers/ViolationMapper";
import type { RideDraftField } from "./RideDraft";

/**
 * The form field that shows the refusal of each ride request field. A refused coordinate is shown
 * on the address it belongs to, since there is no coordinate input.
 */
export const RIDE_REJECTED_FIELDS: FieldMap<RideDraftField> = {
  phoneNumber: "phone",
  pickupAddress: "pickupAddress",
  pickupLatitude: "pickupAddress",
  pickupLongitude: "pickupAddress",
  pickupCoordinates: "pickupAddress",
  destinationAddress: "destinationAddress",
  destinationLatitude: "destinationAddress",
  destinationLongitude: "destinationAddress",
  destinationCoordinates: "destinationAddress",
};
