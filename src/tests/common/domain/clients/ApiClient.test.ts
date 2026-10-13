import { describe, expect, it } from "vitest";
import { ApiClient } from "../../../../common/domain/clients/ApiClient";
import {
  csrfResponse,
  jsonResponse as json,
  queuedFetch as transport,
  requestedPaths as paths,
} from "../../http";

const csrf = (token = "proof") => csrfResponse(token);

describe("ApiClient CSRF proof", () => {
  it("fetches the proof once and reuses it for later unsafe requests", async () => {
    const fetcher = transport(csrf(), json(204), json(204));
    const client = new ApiClient({ fetcher });

    await client.send("DELETE", "/api/v1/accounts/1");
    await client.send("DELETE", "/api/v1/accounts/2");

    expect(paths(fetcher)).toEqual([
      "/api/v1/auth/session/csrf",
      "/api/v1/accounts/1",
      "/api/v1/accounts/2",
    ]);
    expect(fetcher.mock.calls[2][1].headers).toEqual({
      "X-CSRF-Token": "proof",
    });
  });

  it("refetches the proof and retries once when a reused proof is rejected", async () => {
    const fetcher = transport(
      csrf("old"),
      json(204),
      json(403),
      csrf("new"),
      json(204),
    );
    const client = new ApiClient({ fetcher });

    await client.send("DELETE", "/api/v1/accounts/1");
    await client.send("DELETE", "/api/v1/accounts/2");

    expect(fetcher.mock.calls[4][1].headers).toEqual({
      "X-CSRF-Token": "new",
    });
    expect(fetcher).toHaveBeenCalledTimes(5);
  });

  it("does not retry a 403 on a freshly fetched proof", async () => {
    const fetcher = transport(csrf(), json(403));
    const client = new ApiClient({ fetcher });

    await expect(client.send("DELETE", "/api/v1/accounts/1")).rejects.toMatchObject({
      status: 403,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("drops the cached proof after the session is renewed", async () => {
    const fetcher = transport(
      csrf("before"),
      json(401),
      csrf("after"),
      json(204),
    );
    const client = new ApiClient({ fetcher, recover: async () => true });

    await client.send("DELETE", "/api/v1/accounts/1");

    expect(fetcher.mock.calls[3][1].headers).toEqual({
      "X-CSRF-Token": "after",
    });
  });
});
