import type { Role } from "../../../common/domain/models/Role";

export type AccountStatus = "ACTIVE" | "DISABLED";

export const ACCOUNT_STATUSES: readonly AccountStatus[] = [
  "ACTIVE",
  "DISABLED",
];

export interface Account {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: Role[];
  status: AccountStatus;
  createdAt: string;
}
