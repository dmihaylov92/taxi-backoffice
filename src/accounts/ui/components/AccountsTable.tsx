import { formatDateTime } from "../../../common/domain/services/DateFormatService";
import type { Account } from "../../domain/models/Account";
import { accountsCopy } from "../assets/copy";
import { AccountRowMenu, type RowAction } from "./AccountRowMenu";
import { RoleBadge, StatusBadge } from "./Badges";

interface AccountsTableProps {
  accounts: readonly Account[];
  currentUserId: string;
  /** Account with a row action in flight; its menu is disabled. */
  busyId?: string;
  busy: boolean;
  onAction: (account: Account, action: RowAction) => void;
}

export function displayName(account: Account): string {
  return (
    [account.firstName, account.lastName].filter(Boolean).join(" ") ||
    accountsCopy.noName
  );
}

function initials(account: Account): string {
  const letters = [account.firstName, account.lastName]
    .filter((part): part is string => Boolean(part))
    .map((part) => part.slice(0, 1));

  return (letters.join("") || account.email.slice(0, 1)).toUpperCase();
}

/** Own account is read-only here: the API forbids self-edit and self-delete. */
function actionsFor(account: Account, currentUserId: string): RowAction[] {
  if (account.id === currentUserId) {
    return [];
  }

  return account.status === "ACTIVE"
    ? ["edit", "resend", "deactivate", "remove"]
    : ["edit", "remove"];
}

export function AccountsTable({
  accounts,
  currentUserId,
  busyId,
  busy,
  onAction,
}: AccountsTableProps) {
  return (
    <div className="table-wrap" aria-busy={busy}>
      <table className="accounts-table">
        <caption className="sr-only">{accountsCopy.tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{accountsCopy.columns.name}</th>
            <th scope="col">{accountsCopy.columns.email}</th>
            <th scope="col">{accountsCopy.columns.roles}</th>
            <th scope="col">{accountsCopy.columns.status}</th>
            <th scope="col">{accountsCopy.columns.created}</th>
            <th scope="col" className="actions-col">
              <span className="sr-only">{accountsCopy.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => {
            const name = displayName(account);

            return (
              <tr key={account.id}>
                <th scope="row">
                  <span className="avatar" aria-hidden="true">
                    {initials(account)}
                  </span>
                  <span className={account.firstName || account.lastName ? "" : "muted"}>
                    {name}
                  </span>
                </th>
                <td className="email-cell">{account.email}</td>
                <td>
                  <span className="badge-row">
                    {account.roles.map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                  </span>
                </td>
                <td>
                  <StatusBadge status={account.status} />
                </td>
                <td className="date-cell">{formatDateTime(account.createdAt)}</td>
                <td className="actions-col">
                  <AccountRowMenu
                    accountName={name === accountsCopy.noName ? account.email : name}
                    actions={actionsFor(account, currentUserId)}
                    disabled={busyId === account.id}
                    onSelect={(action) => onAction(account, action)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
