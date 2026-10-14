import type { Role } from "../../../common/domain/models/Role";
import { landingPath } from "../../../common/domain/services/AccessService";

export type { Role };

export interface Identity {
  id: string;
  email: string;
  roles: Role[];
}

/**
 * The first screen the account may open, per the module table; accounts with no internal screen
 * (a driver alone) land on the signed-in notice.
 */
export function homePath(identity: Identity): string {
  return landingPath(identity.roles) ?? "/authenticated";
}
