import { describe, expect, it } from "vitest";
import { consumeLinkToken } from "../../../../auth/domain/services/ResetLinkService";

describe("ResetLinkService", () => {
  it("captures only link paths and scrubs fragment", () => {
    history.replaceState(null, "", "/reset-password#token=synthetic");

    expect(consumeLinkToken()).toBe("synthetic");
    expect(location.hash).toBe("");
    expect(consumeLinkToken()).toBeUndefined();

    history.replaceState(null, "", "/login#token=synthetic");

    expect(consumeLinkToken()).toBeUndefined();
    expect(location.hash).toBe("");
  });
});
