import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthClient } from "../../../../auth/domain/clients/AuthClient";
import { AuthService } from "../../../../auth/domain/services/AuthService";
import {
  csrfResponse as csrf,
  jsonResponse as response,
  queuedFetch,
} from "../../../common/http";

const user = { id: "test", email: "test@example.test", roles: ["ADMIN"] };

function transport(...responses: Response[]) {
  const fetcher = queuedFetch(...responses);

  vi.stubGlobal("fetch", fetcher);

  return fetcher;
}

function createService() {
  return new AuthService(new AuthClient());
}

afterEach(() => vi.unstubAllGlobals());

describe("cookie session client and service (mocked HTTP)", () => {
  it("login posts credentials with CSRF proof and same-origin cookies, then reads identity", async () => {
    const fetcher = transport(csrf(), response(204), response(200, user));

    expect(await createService().login(user.email, "synthetic")).toEqual(user);
    expect(fetcher.mock.calls[0][0]).toBe("/api/v1/auth/session/csrf");
    expect(fetcher.mock.calls[1]).toEqual([
      "/api/v1/auth/session",
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-CSRF-Token": "synthetic-proof",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: user.email, password: "synthetic" }),
      }),
    ]);
    expect(fetcher.mock.calls[2][0]).toBe("/api/v1/auth/me");
  });

  it("never sends an Authorization header", async () => {
    const fetcher = transport(csrf(), response(204), response(200, user));

    await createService().login(user.email, "synthetic");

    for (const [, init] of fetcher.mock.calls) {
      expect(JSON.stringify(init)).not.toContain("Authorization");
    }
  });

  it("single-flights bootstrap", async () => {
    const fetcher = transport(response(200, user));
    const service = createService();

    expect(await Promise.all([service.session(), service.session()])).toEqual([
      user,
      user,
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("rotates the cookies once when the access cookie expired", async () => {
    const fetcher = transport(
      response(401),
      response(401),
      csrf(),
      response(204),
      response(200, user),
    );

    expect(await createService().session()).toEqual(user);
    expect(fetcher.mock.calls[3][0]).toBe("/api/v1/auth/session/refresh");
  });

  it("skips rotation when another tab already refreshed", async () => {
    const fetcher = transport(response(401), response(200, user));

    expect(await createService().session()).toEqual(user);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("is unauthenticated when refresh is rejected", async () => {
    transport(response(401), response(401), csrf(), response(401));

    expect(await createService().session()).toBeNull();
  });

  it.each([403, 429, 503])("preserves %s bootstrap failures without retry", async (status) => {
    const fetcher = transport(response(status));

    await expect(createService().session()).rejects.toMatchObject({ status });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("logout uncertainty is not success", async () => {
    transport(csrf(), response(503));

    await expect(createService().logout()).rejects.toMatchObject({
      status: 503,
    });
  });

  it("logout confirms only on a 204", async () => {
    const fetcher = transport(csrf(), response(204));

    expect(await createService().logout()).toBe(true);
    expect(fetcher.mock.calls[1][0]).toBe("/api/v1/auth/session/logout");
  });

  it("recovery and reset carry the same cached proof", async () => {
    const fetcher = transport(csrf(), response(202), response(204));
    const service = createService();

    await service.forgot(user.email);
    await service.reset("synthetic-link", "synthetic-password");

    expect(fetcher.mock.calls[1][0]).toBe("/api/v1/auth/forgot-password");
    expect(fetcher.mock.calls[2][1].headers).toMatchObject({
      "X-CSRF-Token": "synthetic-proof",
    });
    expect(fetcher.mock.calls[2][1].body).toBe(
      JSON.stringify({ token: "synthetic-link", password: "synthetic-password" }),
    );
  });
});
