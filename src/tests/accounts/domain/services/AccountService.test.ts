import { describe, expect, it, vi } from "vitest";
import type { AccountClient } from "../../../../accounts/domain/clients/AccountClient";
import {
  AccountService,
  PAGE_SIZE,
} from "../../../../accounts/domain/services/AccountService";
import { admin, driver } from "../../fixtures";

function rawAccount(index: number) {
  return { ...driver, id: `acc-${index}`, email: `u${index}@taxi.test` };
}

function createService(overrides: Record<string, unknown>) {
  const client = {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    resendInvitation: vi.fn(),
    ...overrides,
  };

  return {
    client,
    service: new AccountService(client as unknown as AccountClient),
  };
}

describe("AccountService", () => {
  it("asks for one extra row and reports a next page without showing it", async () => {
    const rows = Array.from({ length: PAGE_SIZE + 1 }, (_, index) =>
      rawAccount(index),
    );
    const { client, service } = createService({
      list: vi.fn().mockResolvedValue(rows),
    });

    const page = await service.list({ text: "iv", role: "DRIVER" }, 1);

    expect(client.list).toHaveBeenCalledWith(
      `q=iv&role=DRIVER&page=1&size=${PAGE_SIZE + 1}`,
      undefined,
    );
    expect(page.items).toHaveLength(PAGE_SIZE);
    expect(page.hasNext).toBe(true);
  });

  it("reports no next page on a short result", async () => {
    const { service } = createService({
      list: vi.fn().mockResolvedValue([rawAccount(1)]),
    });

    const page = await service.list({ text: "" }, 0);

    expect(page.items).toHaveLength(1);
    expect(page.hasNext).toBe(false);
  });

  it("deactivates by resending the account with DISABLED status", async () => {
    const update = vi.fn().mockResolvedValue({ ...admin, status: "DISABLED" });
    const { service } = createService({ update });

    await service.deactivate(driver);

    expect(update).toHaveBeenCalledWith("acc-driver", {
      email: "ivan.petrov@taxi.test",
      firstName: "Иван",
      lastName: "Петров",
      roles: ["DRIVER"],
      status: "DISABLED",
    });
  });

  it("rejects malformed responses instead of rendering them", async () => {
    const { service } = createService({
      create: vi.fn().mockResolvedValue({ nope: true }),
    });

    await expect(
      service.create({
        email: "a@taxi.test",
        firstName: "",
        lastName: "",
        roles: ["DRIVER"],
        status: "ACTIVE",
      }),
    ).rejects.toThrow();
  });
});
