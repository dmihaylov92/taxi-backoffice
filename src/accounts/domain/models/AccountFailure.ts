export type AccountFailureKind =
  | "unauthenticated"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "invalid"
  | "size"
  | "throttled"
  | "unavailable"
  | "offline";

export interface AccountFailure {
  kind: AccountFailureKind;
}
