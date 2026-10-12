export type AuthFailureKind =
  | "integrationPending"
  | "credentials"
  | "invalidLink"
  | "loginConflict"
  | "resetConflict"
  | "throttled"
  | "invalid"
  | "size"
  | "forbidden"
  | "uncertain"
  | "unavailable"
  | "offline";

export interface AuthFailure {
  kind: AuthFailureKind;
  terminal: boolean;
}
