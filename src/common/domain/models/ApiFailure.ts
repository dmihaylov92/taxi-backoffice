import type { Violation } from "./Violation";

/** Transport-level outcomes of a failed API request, shared by every slice. */
export type ApiFailureKind =
  | "unauthenticated"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "invalid"
  | "size"
  | "throttled"
  | "unavailable"
  | "offline";

export interface ApiFailure {
  kind: ApiFailureKind;
  /** The fields the API refused and why, when it said; only meaningful for `invalid`. */
  violations?: readonly Violation[];
}
