/** A place proposed by the address search provider. */
export interface AddressSuggestion {
  id: string;
  /** Full address as it is stored on the ride. */
  label: string;
  /** Locality shown under the label. */
  context?: string;
}
