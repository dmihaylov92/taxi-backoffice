import { ROLES, type Role } from "../../../common/domain/models/Role";
import {
  ACCOUNT_STATUSES,
  type Account,
  type AccountStatus,
} from "../models/Account";
import type { AccountDraft } from "../models/AccountDraft";
import type { AccountFilters } from "../models/AccountFilters";

/** Body shared by the create and update endpoints. */
export interface AccountRequestBody {
  email: string;
  firstName?: string;
  lastName?: string;
  roles: Role[];
  status: AccountStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function toAccount(raw: unknown): Account {
  if (
    !isRecord(raw) ||
    typeof raw.id !== "string" ||
    typeof raw.email !== "string" ||
    typeof raw.createdAt !== "string" ||
    !ACCOUNT_STATUSES.includes(raw.status as AccountStatus) ||
    !Array.isArray(raw.roles) ||
    !raw.roles.every((role) => ROLES.includes(role as Role))
  ) {
    throw new Error("Unexpected account response");
  }

  const roles: unknown[] = raw.roles;

  return {
    id: raw.id,
    email: raw.email,
    firstName: optionalText(raw.firstName),
    lastName: optionalText(raw.lastName),
    roles: ROLES.filter((role) => roles.includes(role)),
    status: raw.status as AccountStatus,
    createdAt: raw.createdAt,
  };
}

export function toAccounts(raw: unknown): Account[] {
  if (!Array.isArray(raw)) {
    throw new Error("Unexpected account list response");
  }

  return raw.map(toAccount);
}

function trimmedOrUndefined(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export function toRequestBody(draft: AccountDraft): AccountRequestBody {
  return {
    email: draft.email.trim(),
    firstName: trimmedOrUndefined(draft.firstName),
    lastName: trimmedOrUndefined(draft.lastName),
    roles: ROLES.filter((role) => draft.roles.includes(role)),
    status: draft.status,
  };
}

export function toDraft(account: Account): AccountDraft {
  return {
    email: account.email,
    firstName: account.firstName ?? "",
    lastName: account.lastName ?? "",
    roles: [...account.roles],
    status: account.status,
  };
}

/** Builds the list query string; `size` is the number of rows requested from the API. */
export function toListQuery(
  filters: AccountFilters,
  page: number,
  size: number,
): string {
  const query = new URLSearchParams();
  const text = filters.text.trim();

  if (text) {
    query.set("q", text);
  }

  if (filters.role) {
    query.set("role", filters.role);
  }

  if (filters.status) {
    query.set("status", filters.status);
  }

  query.set("page", String(page));
  query.set("size", String(size));

  return query.toString();
}

/** List state kept in the address bar so filtered pages can be reloaded and shared. */
export interface AccountQuery {
  filters: AccountFilters;
  /** Zero-based page index. */
  page: number;
}

const MAX_PAGE = 1000;

/** Reads list state from the address bar, ignoring values the API would reject. */
export function fromSearchParams(params: URLSearchParams): AccountQuery {
  const role = params.get("role");
  const status = params.get("status");
  const page = Number(params.get("page") ?? 0);

  return {
    filters: {
      text: params.get("q") ?? "",
      role: ROLES.includes(role as Role)
        ? (role as Role)
        : undefined,
      status: ACCOUNT_STATUSES.includes(status as AccountStatus)
        ? (status as AccountStatus)
        : undefined,
    },
    page: Number.isInteger(page) && page > 0 && page <= MAX_PAGE ? page : 0,
  };
}

export function toSearchParams(query: AccountQuery): URLSearchParams {
  const params = new URLSearchParams();
  const text = query.filters.text.trim();

  if (text) {
    params.set("q", text);
  }

  if (query.filters.role) {
    params.set("role", query.filters.role);
  }

  if (query.filters.status) {
    params.set("status", query.filters.status);
  }

  if (query.page > 0) {
    params.set("page", String(query.page));
  }

  return params;
}
