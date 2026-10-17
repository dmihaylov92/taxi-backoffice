import type { Coordinates } from "../../../common/domain/models/Coordinates";
import type { RideType } from "./Ride";

/** Country prefix shown beside the phone input; the draft holds only the digits after it. */
export const PHONE_PREFIX = "+359";

/** Editable ride fields exactly as typed. */
export interface RideDraft {
  type: RideType;
  /** National part typed after the prefix; spaces allowed. */
  phone: string;
  pickupAddress: string;
  destinationAddress: string;
  /** Set by choosing a proposal; any later edit of the address text clears it. */
  pickupCoordinates?: Coordinates;
  destinationCoordinates?: Coordinates;
  /** Identifier of the chosen driver, or empty for none. */
  driverId: string;
  /** `datetime-local` values (`yyyy-MM-ddTHH:mm`) or empty. */
  plannedFrom: string;
  plannedTo: string;
}

export type RideDraftField =
  | "phone"
  | "pickupAddress"
  | "destinationAddress"
  | "driverId"
  | "plannedTo";

export type RideDraftErrorKind =
  | "phoneRequired"
  | "phoneInvalid"
  | "pickupRequired"
  | "destinationRequired"
  | "addressTooLong"
  | "addressInvalid"
  | "driverRequired"
  | "periodInvalid";

export type RideDraftErrors = Partial<Record<RideDraftField, RideDraftErrorKind>>;

export const EMPTY_RIDE_DRAFT: RideDraft = {
  type: "NORMAL",
  phone: "",
  pickupAddress: "",
  destinationAddress: "",
  driverId: "",
  plannedFrom: "",
  plannedTo: "",
};
