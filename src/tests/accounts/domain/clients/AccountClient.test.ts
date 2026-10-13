import { describe, expect, it, vi } from "vitest";
import { AccountClient } from "../../../../accounts/domain/clients/AccountClient";
import { ApiClient } from "../../../../common/domain/clients/ApiClient";
import { ApiError } from "../../../../common/domain/models/ApiError";
import { csrfResponse, jsonResponse as json, queuedFetch } from "../../../common/http";

const csrf = () => csrfResponse("proof");

function clientWith(responses: Response[], recover?: () => Promise<boolean>) {
  const fetcher = queuedFetch(...responses);

  return {
    fetcher,
    client: new AccountClient(new ApiClient({ fetcher, recover })),
  };
}

describe("AccountClient", () => {
  it("lists with cookies and no CSRF proof", async () => {
    const { client, fetcher } = clientWith([json(200, [])]);

    await client.list("page=0&size=21");

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/accounts?page=0&size=21",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("sends updates with a fresh CSRF proof and an encoded id", async () => {
    const { client, fetcher } = clientWith([csrf(), json(200, { id: "a/b" })]);

    await client.update("a/b", {
      email: "a@taxi.test",
      roles: ["DRIVER"],
      status: "ACTIVE",
    });

    expect(fetcher.mock.calls[0][0]).toBe("/api/v1/auth/session/csrf");
    expect(fetcher.mock.calls[1][0]).toBe("/api/v1/accounts/a%2Fb");
    expect(fetcher.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        method: "PUT",
        headers: {
          "X-CSRF-Token": "proof",
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("renews the session once on 401 and replays the request", async () => {
    const recover = vi.fn().mockResolvedValue(true);
    const { client, fetcher } = clientWith(
      [json(401), json(200, [{ id: "1" }])],
      recover,
    );

    await expect(client.list("page=0&size=21")).resolves.toEqual([{ id: "1" }]);
    expect(recover).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("surfaces 401 when the session cannot be renewed", async () => {
    const recover = vi.fn().mockResolvedValue(false);
    const { client } = clientWith([json(401)], recover);

    await expect(client.list("page=0&size=21")).rejects.toMatchObject({
      status: 401,
    });
  });

  it("does not loop when the replay is also rejected", async () => {
    const recover = vi.fn().mockResolvedValue(true);
    const { client, fetcher } = clientWith(
      [csrf(), json(401), csrf(), json(401)],
      recover,
    );

    await expect(client.remove("x")).rejects.toBeInstanceOf(ApiError);
    expect(recover).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("maps network failure to status 0", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));
    const client = new AccountClient(new ApiClient({ fetcher }));

    await expect(client.list("page=0&size=21")).rejects.toMatchObject({
      status: 0,
    });
  });
});
