import type { Role } from "../../../common/domain/models/Role";
import type { AccountStatus } from "./Account";

/** Empty text and undefined role/status mean "no restriction". */
export interface AccountFilters {
  text: string;
  role?: Role;
  status?: AccountStatus;
}

export const NO_FILTERS: AccountFilters = { text: "" };
