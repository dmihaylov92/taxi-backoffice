import type { Role } from "../../../common/domain/models/Role";
import type { AccountStatus } from "../../domain/models/Account";
import { accountsCopy } from "../assets/copy";

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`badge role-${role.toLowerCase()}`}>
      {accountsCopy.roles[role]}
    </span>
  );
}

export function StatusBadge({ status }: { status: AccountStatus }) {
  return (
    <span className={`badge status-${status.toLowerCase()}`}>
      {accountsCopy.statuses[status]}
    </span>
  );
}
