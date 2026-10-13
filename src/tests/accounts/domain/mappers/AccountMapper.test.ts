import { describe, expect, it } from "vitest";
import {
  fromSearchParams,
  toAccount,
  toAccounts,
  toListQuery,
  toRequestBody,
  toSearchParams,
} from "../../../../accounts/domain/mappers/AccountMapper";
import { EMPTY_DRAFT } from "../../../../accounts/domain/models/AccountDraft";

const raw = {
  id: "1",
  email: "a@taxi.test",
  roles: ["DRIVER", "ADMIN"],
  status: "ACTIVE",
  availability: "OFFLINE",
  firstName: "",
  lastName: "Петров",
  createdAt: "2026-08-14T10:24:00Z",
  updatedAt: "2026-08-14T10:24:00Z",
};

describe("AccountMapper", () => {
  it("keeps only the fields the screens use, with roles in a stable order", () => {
    expect(toAccount(raw)).toEqual({
      id: "1",
      email: "a@taxi.test",
      firstName: undefined,
      lastName: "Петров",
      roles: ["ADMIN", "DRIVER"],
      status: "ACTIVE",
      createdAt: "2026-08-14T10:24:00Z",
    });
  });

  it("rejects unexpected response shapes", () => {
    expect(() => toAccount({ ...raw, roles: ["CUSTOMER"] })).toThrow();
    expect(() => toAccount({ ...raw, status: "DELETED" })).toThrow();
    expect(() => toAccount(null)).toThrow();
    expect(() => toAccounts({})).toThrow();
  });

  it("builds a request body that trims text and omits blank names", () => {
    expect(
      toRequestBody({
        ...EMPTY_DRAFT,
        email: "  a@taxi.test ",
        firstName: "   ",
        lastName: " Петров ",
        roles: ["DRIVER", "ADMIN"],
      }),
    ).toEqual({
      email: "a@taxi.test",
      firstName: undefined,
      lastName: "Петров",
      roles: ["ADMIN", "DRIVER"],
      status: "ACTIVE",
    });
  });

  it("encodes only active filters into the list query", () => {
    expect(toListQuery({ text: "  ivan " }, 0, 21)).toBe(
      "q=ivan&page=0&size=21",
    );
    expect(
      toListQuery({ text: "", role: "DRIVER", status: "DISABLED" }, 2, 21),
    ).toBe("role=DRIVER&status=DISABLED&page=2&size=21");
  });
});

describe("AccountMapper list state in the address", () => {
  it("reads valid list state from the address", () => {
    const query = fromSearchParams(
      new URLSearchParams("q=ivan&role=DRIVER&status=ACTIVE&page=3"),
    );

    expect(query).toEqual({
      filters: { text: "ivan", role: "DRIVER", status: "ACTIVE" },
      page: 3,
    });
  });

  it("drops values the API would reject", () => {
    const query = fromSearchParams(
      new URLSearchParams("role=CUSTOMER&status=x&page=-4"),
    );

    expect(query).toEqual({
      filters: { text: "", role: undefined, status: undefined },
      page: 0,
    });
    expect(fromSearchParams(new URLSearchParams("page=1.5")).page).toBe(0);
    expect(fromSearchParams(new URLSearchParams("page=99999")).page).toBe(0);
  });

  it("writes a minimal address and round-trips", () => {
    const query = {
      filters: { text: " ivan ", role: undefined, status: "DISABLED" as const },
      page: 0,
    };

    expect(toSearchParams(query).toString()).toBe("q=ivan&status=DISABLED");
    expect(fromSearchParams(toSearchParams(query)).filters.text).toBe("ivan");
  });
});
