import { describe, expect, it } from "vitest";
import { toRejectedFields } from "../../../../common/domain/mappers/ViolationMapper";

type Field = "phone" | "address";

const fieldMap = {
  phoneNumber: "phone",
  addressLine: "address",
  addressLatitude: "address",
} as const;

describe("ViolationMapper", () => {
  it("puts the reason of each refused request field on its form field", () => {
    expect(
      toRejectedFields<Field>(
        [
          { field: "phoneNumber", code: "REQUIRED" },
          { field: "addressLatitude", code: "OUT_OF_RANGE" },
        ],
        fieldMap,
      ),
    ).toEqual({ phone: "REQUIRED", address: "OUT_OF_RANGE" });
  });

  it("keeps the first reason when several request fields share a form field", () => {
    expect(
      toRejectedFields<Field>(
        [
          { field: "addressLine", code: "TOO_LONG" },
          { field: "addressLatitude", code: "OUT_OF_RANGE" },
        ],
        fieldMap,
      ),
    ).toEqual({ address: "TOO_LONG" });
  });

  it("treats a reason it does not know as invalid", () => {
    expect(
      toRejectedFields<Field>([{ field: "phoneNumber", code: "SOMETHING_NEW" }], fieldMap),
    ).toEqual({ phone: "INVALID" });
  });

  it("ignores request fields the form has no input for, including inherited names", () => {
    expect(
      toRejectedFields<Field>(
        [
          { field: "unknown", code: "INVALID" },
          { field: "constructor", code: "INVALID" },
        ],
        fieldMap,
      ),
    ).toEqual({});
  });
});
