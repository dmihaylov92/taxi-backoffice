import { describe, expect, it } from "vitest";
import { toAuthFailure } from "../../../../auth/domain/mappers/AuthFailureMapper";
import { AuthError } from "../../../../auth/domain/models/AuthError";
import { failureText } from "../../../../auth/ui/assets/copy";

describe("AuthFailureMapper", () => {
  it.each([400, 403, 413, 429])(
    "maps %s without echoing the server message",
    (status) => {
      const failure = toAuthFailure(
        new AuthError(status, "PRIVATE_SERVER_MESSAGE"),
        "login",
      );

      expect(failureText[failure.kind]).not.toContain("PRIVATE_SERVER_MESSAGE");
    },
  );

  it("treats a rejected link as terminal only for password change", () => {
    expect(toAuthFailure(new AuthError(401), "login")).toEqual({
      kind: "credentials",
      terminal: false,
    });
    expect(toAuthFailure(new AuthError(401), "reset")).toEqual({
      kind: "invalidLink",
      terminal: true,
    });
  });

  it("reports an unconfirmed password change on unknown failures", () => {
    expect(toAuthFailure(new AuthError(503), "set")).toEqual({
      kind: "uncertain",
      terminal: true,
    });
    expect(toAuthFailure(new Error("network"), "login")).toEqual({
      kind: "unavailable",
      terminal: false,
    });
  });

  it("surfaces the pending-integration code before status mapping", () => {
    expect(
      toAuthFailure(new AuthError(503, "INTEGRATION_PENDING"), "login").kind,
    ).toBe("integrationPending");
  });
});
