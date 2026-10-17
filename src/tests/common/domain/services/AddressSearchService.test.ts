import { describe, expect, it, vi } from "vitest";
import type { AddressSearchClient } from "../../../../common/domain/clients/AddressSearchClient";
import {
  AddressSearchService,
  createAddressSearch,
  readAddressSearchConfig,
} from "../../../../common/domain/services/AddressSearchService";

function clientWith(): AddressSearchClient {
  return {
    search: vi.fn().mockResolvedValue([{ id: "p1", label: "Марица 5" }]),
    resolve: vi.fn().mockResolvedValue({ latitude: 42.05, longitude: 25.6 }),
  };
}

const signal = new AbortController().signal;
const timing = { debounceMs: 500, minLength: 3 };

describe("AddressSearchService", () => {
  it("does not search for text shorter than the minimum", async () => {
    const client = clientWith();

    expect(await new AddressSearchService(timing, client).search("  ма ", signal)).toEqual(
      [],
    );
    expect(client.search).not.toHaveBeenCalled();
  });

  it("searches for the trimmed text", async () => {
    const client = clientWith();

    await new AddressSearchService(timing, client).search("  Марица ", signal);

    expect(client.search).toHaveBeenCalledWith("Марица", signal);
  });

  it("resolves a proposal to its label and coordinates", async () => {
    const service = new AddressSearchService(timing, clientWith());

    expect(await service.resolve({ id: "p1", label: "Марица 5" }, signal)).toEqual({
      label: "Марица 5",
      coordinates: { latitude: 42.05, longitude: 25.6 },
    });
  });
});

describe("address search configuration", () => {
  it("is switched off without a key", () => {
    expect(readAddressSearchConfig({})).toBeUndefined();
    expect(readAddressSearchConfig({ VITE_GOOGLE_PLACES_API_KEY: "  " })).toBeUndefined();
    expect(createAddressSearch({})).toBeUndefined();
  });

  it("defaults to a 500 ms pause and a bias around Dimitrovgrad", () => {
    expect(readAddressSearchConfig({ VITE_GOOGLE_PLACES_API_KEY: "k" })).toEqual({
      apiKey: "k",
      debounceMs: 500,
      minLength: 3,
      bias: { center: { latitude: 42.05, longitude: 25.6 }, radiusMeters: 15_000 },
    });
  });

  it("takes the pause and the bias from the environment and ignores bad values", () => {
    expect(
      readAddressSearchConfig({
        VITE_GOOGLE_PLACES_API_KEY: "k",
        VITE_ADDRESS_SEARCH_DEBOUNCE_MS: "800",
        VITE_ADDRESS_BIAS_LAT: "43.1",
        VITE_ADDRESS_BIAS_LNG: "x",
        VITE_ADDRESS_BIAS_RADIUS_M: "-5",
      }),
    ).toMatchObject({
      debounceMs: 800,
      bias: { center: { latitude: 43.1, longitude: 25.6 }, radiusMeters: 15_000 },
    });
  });
});
