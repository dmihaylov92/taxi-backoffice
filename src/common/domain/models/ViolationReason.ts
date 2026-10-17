/** The stable reasons the API gives for refusing a request field (see the backend `FieldErrorCode`). */
export const VIOLATION_REASONS = [
  "REQUIRED",
  "TOO_LONG",
  "OUT_OF_RANGE",
  "INVALID_FORMAT",
  "INCOMPLETE",
  "INVALID",
] as const;

export type ViolationReason = (typeof VIOLATION_REASONS)[number];
