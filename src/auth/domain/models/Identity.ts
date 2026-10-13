import type { Role } from "../../../common/domain/models/Role";

export type { Role };

export interface Identity {
  id: string;
  email: string;
  roles: Role[];
}

/** Administrators land on the accounts screen; other roles have no internal screens yet. */
export function homePath(identity: Identity): string {
  return identity.roles.includes("ADMIN") ? "/accounts" : "/authenticated";
}
