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
}
