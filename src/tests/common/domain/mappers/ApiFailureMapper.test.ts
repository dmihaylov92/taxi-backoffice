import { describe, expect, it } from "vitest";
import { toApiFailure } from "../../../../common/domain/mappers/ApiFailureMapper";
import { ApiError } from "../../../../common/domain/models/ApiError";

describe("ApiFailureMapper", () => {
  it.each([
    [0, "offline"],
    [400, "invalid"],
    [401, "unauthenticated"],
    [403, "forbidden"],
    [404, "notFound"],
    [409, "conflict"],
    [413, "size"],
    [429, "throttled"],
    [500, "unavailable"],
    [503, "unavailable"],
  ])("maps status %i to %s", (status, kind) => {
    expect(toApiFailure(new ApiError(status))).toEqual({ kind });
  });

  it("treats unknown errors as unavailable", () => {
    expect(toApiFailure(new Error("boom"))).toEqual({
      kind: "unavailable",
    });
    expect(toApiFailure("x")).toEqual({ kind: "unavailable" });
  });
});
