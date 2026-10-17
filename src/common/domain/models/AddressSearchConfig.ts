import type { Coordinates } from "./Coordinates";

/** Settings of the address search provider, read once from the build environment. */
export interface AddressSearchConfig {
  /** Browser key of the provider; public by nature, so it must be restricted on the provider side. */
  apiKey: string;
  /** Quiet time after the last keystroke before a search is sent. */
  debounceMs: number;
  /** Shortest text worth searching for. */
  minLength: number;
  /** Place proposals near this circle rank first; places elsewhere are still proposed. */
  bias: { center: Coordinates; radiusMeters: number };
}
