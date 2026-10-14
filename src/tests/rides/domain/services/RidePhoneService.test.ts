import { describe, expect, it } from "vitest";
import {
  formatPhone,
  isValidNationalNumber,
  nationalDigits,
} from "../../../../rides/domain/services/RidePhoneService";

describe("RidePhoneService", () => {
  it("formats a stored number in groups", () => {
    expect(formatPhone("+359888123456")).toBe("+359 888 123 456");
  });

  it("shows anything else exactly as received", () => {
    expect(formatPhone("0888123456")).toBe("0888123456");
    expect(formatPhone("+35988812")).toBe("+35988812");
  });

  it("keeps only the digits after the prefix", () => {
    expect(nationalDigits("+359 888-123 456")).toBe("888123456");
    expect(nationalDigits("(888) 123.456")).toBe("888123456");
  });

  it("validates nine national digits", () => {
    expect(isValidNationalNumber("888 123 456")).toBe(true);
    expect(isValidNationalNumber("+359888123456")).toBe(true);
    expect(isValidNationalNumber("88812345")).toBe(false);
    expect(isValidNationalNumber("88812x456")).toBe(false);
  });
});
