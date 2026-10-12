import { describe, expect, it } from "vitest";
import { validate } from "../../../../auth/domain/services/AuthValidationService";

const email = "staff@example.test";

function values(password: string, confirm = "", address = email) {
  return { email: address, password, confirm };
}

describe("AuthValidationService", () => {
  it("allows a short existing password on login", () => {
    expect(validate("login", values("short"))).toEqual({});
  });

  it("counts UTF-16 length and UTF-8 bytes for new passwords", () => {
    expect(validate("reset", values("😀".repeat(18), "😀".repeat(18)))).toEqual(
      {},
    );
    expect(
      validate("reset", values("я".repeat(37), "я".repeat(37))),
    ).toHaveProperty("password", "passwordPolicy");
  });

  it("requires matching confirmation", () => {
    expect(
      validate("set", values("123456789012", "different")),
    ).toHaveProperty("confirm", "passwordMismatch");
  });

  it("rejects malformed email on login and forgot", () => {
    expect(validate("forgot", values("", "", "not-an-email"))).toHaveProperty(
      "email",
      "emailInvalid",
    );
    expect(validate("login", values("", "", email))).toHaveProperty(
      "password",
      "passwordRequired",
    );
  });
});
