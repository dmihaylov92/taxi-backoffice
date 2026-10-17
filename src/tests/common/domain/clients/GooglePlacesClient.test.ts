import { describe, expect, it, vi } from "vitest";
import { GooglePlacesClient } from "../../../../common/domain/clients/GooglePlacesClient";
import type { AddressSearchConfig } from "../../../../common/domain/models/AddressSearchConfig";

const config: AddressSearchConfig = {
  apiKey: "test-key",
  debounceMs: 500,
  minLength: 3,
  bias: { center: { latitude: 42.05, longitude: 25.6 }, radiusMeters: 15_000 },
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("GooglePlacesClient", () => {
  it("posts the typed text with the key, the bias and a session token", async () => {
    const send = vi.fn().mockResolvedValue(
      reply({
        suggestions: [
          { placePrediction: { placeId: "p1", text: { text: "Марица 5" } } },
        ],
      }),
    );
    const signal = new AbortController().signal;

    const found = await new GooglePlacesClient(config, send).search(
      "Марица",
      signal,
    );

    expect(found).toEqual([{ id: "p1", label: "Марица 5", context: undefined }]);

    const [url, init] = send.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe("https://places.googleapis.com/v1/places:autocomplete");
    expect(init.method).toBe("POST");
    expect(init.signal).toBe(signal);
    expect(init.headers["X-Goog-Api-Key"]).toBe("test-key");
    expect(body.input).toBe("Марица");
    expect(body.locationBias.circle.radius).toBe(15_000);
    expect(body.sessionToken).toBeTruthy();
  });

  it("keeps one session token across searches and the lookup, then renews it", async () => {
    const send = vi.fn().mockImplementation(async () =>
      reply({ suggestions: [], location: { latitude: 1, longitude: 2 } }),
    );
    const client = new GooglePlacesClient(config, send);
    const signal = new AbortController().signal;

    await client.search("Мар", signal);
    await client.search("Мари", signal);
    await client.resolve({ id: "p1", label: "Марица 5" }, signal);
    await client.search("Мар", signal);

    const tokens = send.mock.calls.map(([url, init]) =>
      init.body
        ? JSON.parse(init.body).sessionToken
        : new URL(url).searchParams.get("sessionToken"),
    );

    expect(tokens[0]).toBe(tokens[1]);
    expect(tokens[2]).toBe(tokens[0]);
    expect(tokens[3]).not.toBe(tokens[0]);
  });

  it("looks a place up asking only for its location", async () => {
    const send = vi
      .fn()
      .mockResolvedValue(reply({ location: { latitude: 42.05, longitude: 25.6 } }));

    const coordinates = await new GooglePlacesClient(config, send).resolve(
      { id: "p/1", label: "Марица 5" },
      new AbortController().signal,
    );

    expect(coordinates).toEqual({ latitude: 42.05, longitude: 25.6 });

    const [url, init] = send.mock.calls[0];

    expect(url).toContain("https://places.googleapis.com/v1/places/p%2F1?");
    expect(init.headers["X-Goog-FieldMask"]).toBe("location");
  });

  it("fails on a rejected request instead of returning nothing", async () => {
    const send = vi.fn().mockImplementation(async () => reply({ error: {} }, 403));
    const client = new GooglePlacesClient(config, send);
    const signal = new AbortController().signal;

    await expect(client.search("Марица", signal)).rejects.toThrow("403");
    await expect(
      client.resolve({ id: "p1", label: "x" }, signal),
    ).rejects.toThrow("403");
  });
});
