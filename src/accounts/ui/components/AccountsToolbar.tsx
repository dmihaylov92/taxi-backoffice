import { ROLES, type Role } from "../../../common/domain/models/Role";
import {
  ACCOUNT_STATUSES,
  type AccountStatus,
} from "../../domain/models/Account";
import { Icon } from "../../../common/ui/components/Icon";
import { accountsCopy } from "../assets/copy";

interface AccountsToolbarProps {
  text: string;
  role?: Role;
  status?: AccountStatus;
  onTextChange: (text: string) => void;
  onRoleChange: (role?: Role) => void;
  onStatusChange: (status?: AccountStatus) => void;
}

export function AccountsToolbar({
  text,
  role,
  status,
  onTextChange,
  onRoleChange,
  onStatusChange,
}: AccountsToolbarProps) {
  return (
    <div className="toolbar" role="search">
      <div className="search">
        <Icon name="search" size={18} />
        <input
          type="search"
          aria-label={accountsCopy.searchLabel}
          placeholder={accountsCopy.searchPlaceholder}
          maxLength={100}
          autoComplete="off"
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
        />
      </div>
      <select
        aria-label={accountsCopy.roleFilter}
        value={role ?? ""}
        onChange={(event) =>
          onRoleChange((event.target.value || undefined) as Role | undefined)
        }
      >
        <option value="">{accountsCopy.allRoles}</option>
        {ROLES.map((value) => (
          <option key={value} value={value}>
            {accountsCopy.roles[value]}
          </option>
        ))}
      </select>
      <select
        aria-label={accountsCopy.statusFilter}
        value={status ?? ""}
        onChange={(event) =>
          onStatusChange(
            (event.target.value || undefined) as AccountStatus | undefined,
          )
        }
      >
        <option value="">{accountsCopy.allStatuses}</option>
        {ACCOUNT_STATUSES.map((value) => (
          <option key={value} value={value}>
            {accountsCopy.statuses[value]}
          </option>
        ))}
      </select>
    </div>
  );
}
