import { describe, expect, it } from "vitest";
import { EMPTY_DRAFT } from "../../../../accounts/domain/models/AccountDraft";
import {
  hasErrors,
  validateDraft,
} from "../../../../accounts/domain/services/AccountValidationService";

const valid = {
  ...EMPTY_DRAFT,
  email: "ivan@taxi.bg",
  roles: ["DRIVER" as const],
};

describe("AccountValidationService", () => {
  it("accepts a complete draft with blank names", () => {
    const errors = validateDraft(valid, [
      "email",
      "firstName",
      "lastName",
      "roles",
    ]);

    expect(hasErrors(errors)).toBe(false);
  });

  it("rejects malformed and oversized emails", () => {
    const emails = [
      "",
      "no-at",
      "a@b",
      "a b@taxi.bg",
      `${"a".repeat(250)}@x.bg`,
    ];

    for (const email of emails) {
      expect(validateDraft({ ...valid, email }, ["email"])).toEqual({
        email: "emailInvalid",
      });
    }
  });

  it("requires a role and limits names", () => {
    expect(validateDraft({ ...valid, roles: [] }, ["roles"])).toEqual({
      roles: "rolesRequired",
    });
    expect(
      validateDraft({ ...valid, firstName: "a".repeat(101) }, ["firstName"]),
    ).toEqual({ firstName: "nameInvalid" });
    expect(
      validateDraft({ ...valid, lastName: "bad\u0000name" }, ["lastName"]),
    ).toEqual({ lastName: "nameInvalid" });
  });

  it("only checks the requested fields", () => {
    expect(validateDraft({ ...EMPTY_DRAFT }, ["firstName"])).toEqual({});
  });
});
