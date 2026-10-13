import { describe, expect, it } from "vitest";
import {
  EMPTY_CAR_DRAFT,
  type CarDraft,
  type DraftField,
} from "../../../../rides/domain/models/CarDraft";
import {
  hasErrors,
  validateDraft,
} from "../../../../rides/domain/services/CarValidationService";

const ALL: DraftField[] = ["plate", "make", "model", "vin", "mileageKm"];

function draft(patch: Partial<CarDraft>): CarDraft {
  return { ...EMPTY_CAR_DRAFT, plate: "CB 1234 AB", ...patch };
}

describe("CarValidationService", () => {
  it("accepts a plate alone and a fully filled car", () => {
    expect(hasErrors(validateDraft(draft({}), ALL))).toBe(false);
    expect(
      hasErrors(
        validateDraft(
          draft({
            make: "Skoda",
            model: "Octavia",
            vin: "tmbjb7nx0lz123456",
            mileageKm: "120000",
            servicedAt: "2026-01-15",
          }),
          ALL,
        ),
      ),
    ).toBe(false);
  });

  it("requires a plate", () => {
    expect(validateDraft(draft({ plate: "   " }), ALL).plate).toBe(
      "plateRequired",
    );
  });

  it.each(["CB!234", "A".repeat(21)])("rejects plate %s", (plate) => {
    expect(validateDraft(draft({ plate }), ALL).plate).toBe("plateInvalid");
  });

  it("accepts Cyrillic plates with spaces", () => {
    expect(validateDraft(draft({ plate: "СВ 1234 АВ" }), ALL).plate).toBe(
      undefined,
    );
  });

  it.each(["SHORT", "TMBJB7NX0LZ12345I", "TMBJB7NX0LZ1234567"])(
    "rejects VIN %s",
    (vin) => {
      expect(validateDraft(draft({ vin }), ALL).vin).toBe("vinInvalid");
    },
  );

  it("rejects overlong or control-character text", () => {
    expect(validateDraft(draft({ make: "M".repeat(51) }), ALL).make).toBe(
      "textTooLong",
    );
    expect(validateDraft(draft({ model: "Oc\u0007ta" }), ALL).model).toBe(
      "textTooLong",
    );
  });

  it.each(["-1", "12.5", "abc", "12345678"])("rejects mileage %s", (value) => {
    expect(validateDraft(draft({ mileageKm: value }), ALL).mileageKm).toBe(
      "mileageInvalid",
    );
  });

  it("validates only the requested fields", () => {
    expect(hasErrors(validateDraft(draft({ plate: "" }), ["vin"]))).toBe(false);
  });
});
