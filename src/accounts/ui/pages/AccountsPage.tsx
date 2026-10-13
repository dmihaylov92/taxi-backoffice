import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { ConfirmDialog } from "../../../common/ui/components/ConfirmDialog";
import { useDebouncedCallback } from "../../../common/ui/hooks/useDebouncedCallback";
import {
  fromSearchParams,
  toDraft,
  toSearchParams,
} from "../../domain/mappers/AccountMapper";
import type { Account } from "../../domain/models/Account";
import {
  EMPTY_DRAFT,
  type AccountDraft,
} from "../../domain/models/AccountDraft";
import type { AccountFilters } from "../../domain/models/AccountFilters";
import type { AccountApi } from "../../domain/services/AccountService";
import { accountFailureText, accountsCopy } from "../assets/copy";
import { AccountFormDialog } from "../components/AccountFormDialog";
import type { RowAction } from "../components/AccountRowMenu";
import { AccountsTable, displayName } from "../components/AccountsTable";
import { AccountsToolbar } from "../components/AccountsToolbar";
import { ConfirmRemoveDialog } from "../components/ConfirmRemoveDialog";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ListStates";
import { Pagination } from "../components/Pagination";
import { useAccountAction } from "../components/useAccountAction";
import { useAccountList } from "../components/useAccountList";

const SEARCH_DEBOUNCE_MS = 300;

type Dialog =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; account: Account }
  | { kind: "remove"; account: Account }
  | { kind: "invitation"; email: string };

interface AccountsPageProps {
  accounts: AccountApi;
  currentUserId: string;
  /** The API rejected the session; the host decides how to sign the user out. */
  onSessionExpired: () => void;
}

export function AccountsPage({
  accounts,
  currentUserId,
  onSessionExpired,
}: AccountsPageProps) {
  const [params, setParams] = useSearchParams();
  const { filters, page } = useMemo(() => fromSearchParams(params), [params]);
  const [searchText, setSearchText] = useState(filters.text);
  const [dialog, setDialog] = useState<Dialog>({ kind: "none" });
  const [success, setSuccess] = useState<string>();
  const [busyId, setBusyId] = useState<string>();
  const rowAction = useAccountAction(onSessionExpired);
  const list = useAccountList(accounts, filters, page, onSessionExpired);
  const { reload } = list;
  const notice = rowAction.failure
    ? { tone: "error", text: accountFailureText[rowAction.failure.kind] }
    : success
      ? { tone: "success", text: success }
      : undefined;
  const filtered = Boolean(filters.text || filters.role || filters.status);

  function navigate(nextFilters: AccountFilters, nextPage: number) {
    setParams(toSearchParams({ filters: nextFilters, page: nextPage }), {
      replace: true,
    });
  }

  const search = useDebouncedCallback(
    (text: string) => navigate({ ...filters, text }, 0),
    SEARCH_DEBOUNCE_MS,
  );

  function changeSearch(text: string) {
    setSearchText(text);
    search.call(text);
  }

  function clearNotice() {
    setSuccess(undefined);
    rowAction.reset();
  }

  function clearFilters() {
    search.cancel();
    setSearchText("");
    navigate({ text: "" }, 0);
  }

  function closeDialog() {
    setDialog({ kind: "none" });
  }

  async function create(draft: AccountDraft) {
    const created = await accounts.create(draft);

    search.cancel();
    setSearchText("");
    navigate({ text: "" }, 0);
    clearNotice();
    setDialog({ kind: "invitation", email: created.email });
    reload();
  }

  async function edit(account: Account, draft: AccountDraft) {
    await accounts.update(account.id, draft);

    setSuccess(accountsCopy.notices.saved);
    closeDialog();
    reload();
  }

  async function remove(account: Account) {
    await accounts.remove(account.id);

    setSuccess(accountsCopy.notices.removed);
    closeDialog();
    reload();
  }

  /** Row actions without a dialog report their outcome in the page notice. */
  async function runRowAction(account: Account, task: () => Promise<void>) {
    setBusyId(account.id);
    setSuccess(undefined);
    await rowAction.run(task);
    setBusyId(undefined);
  }

  function onRowAction(account: Account, action: RowAction) {
    switch (action) {
      case "edit": {
        setDialog({ kind: "edit", account });

        break;
      }

      case "remove": {
        setDialog({ kind: "remove", account });

        break;
      }

      case "resend": {
        void runRowAction(account, async () => {
          await accounts.resendInvitation(account.id);
          setDialog({ kind: "invitation", email: account.email });
        });

        break;
      }

      case "deactivate": {
        void runRowAction(account, async () => {
          await accounts.deactivate(account);
          setSuccess(accountsCopy.notices.deactivated);
          reload();
        });

        break;
      }
    }
  }

  function renderBody() {
    if (list.failure) {
      return (
        <ErrorState
          message={
            list.failure.kind === "unavailable"
              ? accountsCopy.errorBody
              : accountFailureText[list.failure.kind]
          }
          onRetry={reload}
        />
      );
    }

    if (!list.page) {
      return <LoadingState />;
    }

    if (list.page.items.length === 0) {
      return (
        <EmptyState
          filtered={filtered || page > 0}
          onCreate={() => setDialog({ kind: "create" })}
          onClear={clearFilters}
        />
      );
    }

    return (
      <>
        <AccountsTable
          accounts={list.page.items}
          currentUserId={currentUserId}
          busyId={busyId}
          busy={list.loading}
          onAction={onRowAction}
        />
        <Pagination
          page={page}
          shown={list.page.items.length}
          hasNext={list.page.hasNext}
          disabled={list.loading}
          onPage={(next) => navigate(filters, next)}
        />
      </>
    );
  }

  return (
    <div className="accounts-page">
      <header className="page-head">
        <div>
          <h1>{accountsCopy.title}</h1>
          <p className="muted">{accountsCopy.subtitle}</p>
        </div>
        <button
          type="button"
          className="btn primary"
          onClick={() => setDialog({ kind: "create" })}
        >
          <span aria-hidden="true">+</span>
          {accountsCopy.newAccount}
        </button>
      </header>

      {notice && (
        <div
          className={`banner ${notice.tone === "error" ? "error" : ""}`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            className="link-button"
            onClick={clearNotice}
          >
            {accountsCopy.dismiss}
          </button>
        </div>
      )}

      <AccountsToolbar
        text={searchText}
        role={filters.role}
        status={filters.status}
        onTextChange={changeSearch}
        onRoleChange={(role) => navigate({ ...filters, role }, 0)}
        onStatusChange={(status) => navigate({ ...filters, status }, 0)}
      />

      <section className="panel">{renderBody()}</section>

      {dialog.kind === "create" && (
        <AccountFormDialog
          mode="create"
          initial={EMPTY_DRAFT}
          onSubmit={create}
          onClose={closeDialog}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "edit" && (
        <AccountFormDialog
          mode="edit"
          initial={toDraft(dialog.account)}
          onSubmit={(draft) => edit(dialog.account, draft)}
          onClose={closeDialog}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "remove" && (
        <ConfirmRemoveDialog
          name={displayName(dialog.account)}
          email={dialog.account.email}
          onConfirm={() => remove(dialog.account)}
          onClose={closeDialog}
          onUnauthenticated={onSessionExpired}
        />
      )}
      {dialog.kind === "invitation" && (
        <ConfirmDialog
          title={accountsCopy.invitation.title}
          confirmLabel={accountsCopy.invitation.confirm}
          onConfirm={closeDialog}
          onClose={closeDialog}
        >
          <p role="status">{accountsCopy.invitation.body(dialog.email)}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
