import type { Coordinates } from "./Coordinates";

/** An address the user picked from the proposals, with the place it resolves to. */
export interface AddressSelection {
  /** Full address as it is stored. */
  label: string;
  coordinates: Coordinates;
}
