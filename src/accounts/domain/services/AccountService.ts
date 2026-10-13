import { AccountClient } from "../clients/AccountClient";
import {
  toAccount,
  toAccounts,
  toDraft,
  toListQuery,
  toRequestBody,
} from "../mappers/AccountMapper";
import type { Account } from "../models/Account";
import type { AccountDraft } from "../models/AccountDraft";
import type { AccountFilters } from "../models/AccountFilters";
import type { AccountPage } from "../models/AccountPage";

export const PAGE_SIZE = 20;

export interface AccountApi {
  list(
    filters: AccountFilters,
    page: number,
    signal?: AbortSignal,
  ): Promise<AccountPage>;
  create(draft: AccountDraft): Promise<Account>;
  update(id: string, draft: AccountDraft): Promise<Account>;
  deactivate(account: Account): Promise<Account>;
  remove(id: string): Promise<void>;
  resendInvitation(id: string): Promise<Account>;
}

export class AccountService implements AccountApi {
  constructor(private readonly client: AccountClient = new AccountClient()) {}

  /** Requests one extra row so that the existence of a next page is known without totals. */
  async list(
    filters: AccountFilters,
    page: number,
    signal?: AbortSignal,
  ): Promise<AccountPage> {
    const raw = await this.client.list(
      toListQuery(filters, page, PAGE_SIZE + 1),
      signal,
    );
    const accounts = toAccounts(raw);

    return {
      items: accounts.slice(0, PAGE_SIZE),
      hasNext: accounts.length > PAGE_SIZE,
    };
  }

  async create(draft: AccountDraft): Promise<Account> {
    return toAccount(await this.client.create(toRequestBody(draft)));
  }

  async update(id: string, draft: AccountDraft): Promise<Account> {
    return toAccount(await this.client.update(id, toRequestBody(draft)));
  }

  deactivate(account: Account): Promise<Account> {
    return this.update(account.id, { ...toDraft(account), status: "DISABLED" });
  }

  remove(id: string): Promise<void> {
    return this.client.remove(id);
  }

  async resendInvitation(id: string): Promise<Account> {
    return toAccount(await this.client.resendInvitation(id));
  }
}
