import type { AddressSuggestion } from "../models/AddressSuggestion";
import type { Coordinates } from "../models/Coordinates";

/** Port to an address provider; the only thing the rest of the app knows about it. */
export interface AddressSearchClient {
  /** Proposals for the typed text, best first. */
  search(text: string, signal: AbortSignal): Promise<AddressSuggestion[]>;
  /** The coordinates of a proposal returned by `search`. */
  resolve(suggestion: AddressSuggestion, signal: AbortSignal): Promise<Coordinates>;
}
