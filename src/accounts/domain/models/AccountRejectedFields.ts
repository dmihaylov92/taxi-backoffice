import type { FieldMap } from "../../../common/domain/mappers/ViolationMapper";
import type { DraftField } from "./AccountDraft";

/** The form field that shows the refusal of each account request field; the names are the same. */
export const ACCOUNT_REJECTED_FIELDS: FieldMap<DraftField> = {
  email: "email",
  firstName: "firstName",
  lastName: "lastName",
  roles: "roles",
};
