import { describe, expect, it } from "vitest";
import { ApiClient } from "../../../../common/domain/clients/ApiClient";
import { CarClient } from "../../../../rides/domain/clients/CarClient";
import { DriverLookupClient } from "../../../../rides/domain/clients/DriverLookupClient";
import { csrfResponse, jsonResponse as json, queuedFetch } from "../../../common/http";

function clientWith(responses: Response[]) {
  const fetcher = queuedFetch(...responses);

  return { fetcher, api: new ApiClient({ fetcher }) };
}

describe("CarClient", () => {
  it("lists with cookies and no CSRF proof", async () => {
    const { api, fetcher } = clientWith([json(200, [])]);

    await new CarClient(api).list("q=cb&page=0&size=21");

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(
      "/api/v1/cars?q=cb&page=0&size=21",
      expect.objectContaining({ credentials: "same-origin" }),
    );
  });

  it("creates and updates with a fresh CSRF proof and an encoded id", async () => {
    const { api, fetcher } = clientWith([
      csrfResponse("proof"),
      json(201, { id: "c1" }),
      json(200, { id: "a/b" }),
    ]);
    const client = new CarClient(api);

    await client.create({ plate: "CB1234AB" });
    await client.update("a/b", { plate: "CB1234AB" });

    expect(fetcher.mock.calls[0][0]).toBe("/api/v1/auth/session/csrf");
    expect(fetcher.mock.calls[1][0]).toBe("/api/v1/cars");
    expect(fetcher.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        headers: {
          "X-CSRF-Token": "proof",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plate: "CB1234AB" }),
      }),
    );
    expect(fetcher.mock.calls[2][0]).toBe("/api/v1/cars/a%2Fb");
    expect(fetcher.mock.calls[2][1]).toEqual(
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("deletes a car", async () => {
    const { api, fetcher } = clientWith([csrfResponse(), json(204)]);

    await new CarClient(api).remove("c1");

    expect(fetcher.mock.calls[1][0]).toBe("/api/v1/cars/c1");
    expect(fetcher.mock.calls[1][1]).toEqual(
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("assigns and unassigns a driver through the car's driver sub-resource", async () => {
    const { api, fetcher } = clientWith([
      csrfResponse(),
      json(200, { id: "c1" }),
      json(200, { id: "c1" }),
    ]);
    const client = new CarClient(api);

    await client.assignDriver("c1", "d/1");
    await client.unassignDriver("c1", "d/1");

    expect(fetcher.mock.calls[1][0]).toBe("/api/v1/cars/c1/drivers/d%2F1");
    expect(fetcher.mock.calls[1][1]).toEqual(
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetcher.mock.calls[2][0]).toBe("/api/v1/cars/c1/drivers/d%2F1");
    expect(fetcher.mock.calls[2][1]).toEqual(
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("DriverLookupClient", () => {
  it("asks for active drivers with one name fragment", async () => {
    const { api, fetcher } = clientWith([json(200, [])]);

    await new DriverLookupClient(api).search("ivan", 50);

    expect(fetcher.mock.calls[0][0]).toBe(
      "/api/v1/accounts?role=DRIVER&status=ACTIVE&q=ivan&page=0&size=50",
    );
  });

  it("omits the fragment when nothing was typed", async () => {
    const { api, fetcher } = clientWith([json(200, [])]);

    await new DriverLookupClient(api).search("", 50);

    expect(fetcher.mock.calls[0][0]).toBe(
      "/api/v1/accounts?role=DRIVER&status=ACTIVE&page=0&size=50",
    );
  });
});
