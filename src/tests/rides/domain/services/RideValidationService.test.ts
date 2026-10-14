import { describe, expect, it } from "vitest";
import {
  EMPTY_RIDE_DRAFT,
  type RideDraft,
} from "../../../../rides/domain/models/RideDraft";
import {
  firstErrorField,
  hasErrors,
  validateDraft,
} from "../../../../rides/domain/services/RideValidationService";

const valid: RideDraft = {
  ...EMPTY_RIDE_DRAFT,
  phone: "888 123 456",
  pickupAddress: "ул. Димитър Благоев 12",
  destinationAddress: "ЖП гара Димитровград",
};

describe("RideValidationService", () => {
  it("accepts a complete normal ride", () => {
    expect(validateDraft(valid)).toEqual({});
  });

  it("requires phone and both addresses for a normal ride", () => {
    expect(validateDraft(EMPTY_RIDE_DRAFT)).toEqual({
      phone: "phoneRequired",
      pickupAddress: "pickupRequired",
      destinationAddress: "destinationRequired",
    });
  });

  it("treats a lone prefix as a missing phone", () => {
    expect(validateDraft({ ...valid, phone: "+359" }).phone).toBe(
      "phoneRequired",
    );
  });

  it.each([
    ["88 12", "too short"],
    ["8881234567", "too long"],
    ["abc123456", "letters"],
    ["0888123456", "leading zero national form"],
  ])("rejects the phone %s (%s)", (phone) => {
    expect(validateDraft({ ...valid, phone }).phone).toBe("phoneInvalid");
  });

  it("accepts the prefix typed or pasted into the input", () => {
    expect(validateDraft({ ...valid, phone: "+359 888 123 456" })).toEqual({});
    expect(validateDraft({ ...valid, phone: "888-123-456" })).toEqual({});
  });

  it("rejects overlong and control-character addresses like the API", () => {
    expect(
      validateDraft({ ...valid, pickupAddress: "а".repeat(201) }).pickupAddress,
    ).toBe("addressTooLong");
    expect(
      validateDraft({ ...valid, destinationAddress: "ул.\u0007 1" })
        .destinationAddress,
    ).toBe("addressInvalid");
    expect(validateDraft({ ...valid, pickupAddress: "а".repeat(200) })).toEqual(
      {},
    );
  });

  it("requires only a driver for a business ride", () => {
    const business: RideDraft = { ...EMPTY_RIDE_DRAFT, type: "BUSINESS" };

    expect(validateDraft(business)).toEqual({ driverId: "driverRequired" });
    expect(validateDraft({ ...business, driverId: "drv-1" })).toEqual({});
  });

  it("still validates optional business fields when they are filled", () => {
    const business: RideDraft = {
      ...EMPTY_RIDE_DRAFT,
      type: "BUSINESS",
      driverId: "drv-1",
      phone: "12",
    };

    expect(validateDraft(business).phone).toBe("phoneInvalid");
  });

  it("requires the planned period to end after it starts", () => {
    const business: RideDraft = {
      ...EMPTY_RIDE_DRAFT,
      type: "BUSINESS",
      driverId: "drv-1",
      plannedFrom: "2026-08-16T18:00",
      plannedTo: "2026-08-14T08:00",
    };

    expect(validateDraft(business).plannedTo).toBe("periodInvalid");
    expect(
      validateDraft({ ...business, plannedTo: "2026-08-16T18:01" }),
    ).toEqual({});
  });

  it("reports the first error in form order", () => {
    const errors = validateDraft(EMPTY_RIDE_DRAFT);

    expect(hasErrors(errors)).toBe(true);
    expect(hasErrors({})).toBe(false);
    expect(
      firstErrorField(errors, ["destinationAddress", "phone"]),
    ).toBe("destinationAddress");
  });
});
