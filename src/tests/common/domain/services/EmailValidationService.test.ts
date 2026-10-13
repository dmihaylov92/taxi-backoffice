import { describe, expect, it } from "vitest";
import { isValidEmail } from "../../../../common/domain/services/EmailValidationService";

describe("EmailValidationService", () => {
  it("accepts ordinary addresses and ignores surrounding whitespace", () => {
    expect(isValidEmail("ivan@taxi.bg")).toBe(true);
    expect(isValidEmail("  ivan.petrov@mail.taxi.bg ")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    for (const email of ["", "ivan", "ivan@", "@taxi.bg", "a@b", "a b@taxi.bg"]) {
      expect(isValidEmail(email)).toBe(false);
    }
  });

  it("limits the original length to 254 characters", () => {
    const local = "a".repeat(64);
    const atLimit = `${local}@${"d".repeat(186)}.bg`;

    expect(atLimit).toHaveLength(254);
    expect(isValidEmail(atLimit)).toBe(true);
    expect(isValidEmail(`${local}@${"d".repeat(187)}.bg`)).toBe(false);
  });
});
