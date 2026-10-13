import type { Role } from "../../../common/domain/models/Role";
import type { AccountStatus } from "./Account";

/** Editable account fields exactly as typed; names are optional and may be blank. */
export interface AccountDraft {
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  status: AccountStatus;
}

export type DraftField = "email" | "firstName" | "lastName" | "roles";

export type DraftErrorKind = "emailInvalid" | "nameInvalid" | "rolesRequired";

export type DraftErrors = Partial<Record<DraftField, DraftErrorKind>>;

export const EMPTY_DRAFT: AccountDraft = {
  email: "",
  firstName: "",
  lastName: "",
  roles: [],
  status: "ACTIVE",
};
