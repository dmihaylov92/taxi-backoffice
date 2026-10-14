import { describe, expect, it } from "vitest";
import { ApiClient } from "../../../../common/domain/clients/ApiClient";
import { RideClient } from "../../../../rides/domain/clients/RideClient";
import {
  csrfResponse,
  jsonResponse as json,
  queuedFetch,
} from "../../../common/http";

function clientWith(responses: Response[]) {
  const fetcher = queuedFetch(...responses);

  return { fetcher, api: new ApiClient({ fetcher }) };
}

const body = {
  phoneNumber: "+359888123456",
  pickupAddress: "A",
  destinationAddress: "B",
};

describe("RideClient", () => {
  it("lists with cookies, the query and no CSRF proof", async () => {
    const controller = new AbortController();
    const { api, fetcher } = clientWith([json(200, [])]);

    await new RideClient(api).list("status=PENDING&page=0&size=20", controller.signal);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/rides?status=PENDING&page=0&size=20",
      expect.objectContaining({
        credentials: "same-origin",
        signal: controller.signal,
      }),
    );
  });

  it("creates with a fresh CSRF proof and the three editable fields", async () => {
    const { api, fetcher } = clientWith([csrfResponse("proof"), json(201, {})]);

    await new RideClient(api).create(body);

    expect(fetcher.mock.calls[0][0]).toBe("/api/v1/auth/session/csrf");
    expect(fetcher.mock.calls[1][0]).toBe("/api/v1/rides");
    expect(fetcher.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: {
          "X-CSRF-Token": "proof",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }),
    );
  });

  it("updates, rejects and deletes against an encoded id", async () => {
    const { api, fetcher } = clientWith([
      csrfResponse(),
      json(200, {}),
      json(200, {}),
      json(204),
    ]);
    const client = new RideClient(api);

    await client.update("a/b", body);
    await client.reject("a/b");
    await client.remove("a/b");

    const calls = fetcher.mock.calls.filter(
      (call) => call[0] !== "/api/v1/auth/session/csrf",
    );

    expect(calls.map((call) => [call[0], call[1].method])).toEqual([
      ["/api/v1/rides/a%2Fb", "PUT"],
      ["/api/v1/rides/a%2Fb/reject", "POST"],
      ["/api/v1/rides/a%2Fb", "DELETE"],
    ]);
  });

  it("throws the API status when the request is refused", async () => {
    const { api } = clientWith([json(403)]);

    await expect(new RideClient(api).list("page=0&size=20")).rejects.toMatchObject(
      { status: 403 },
    );
  });
});
