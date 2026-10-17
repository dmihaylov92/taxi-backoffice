import { describe, expect, it } from "vitest";
import {
  toAutocompleteBody,
  toCoordinates,
  toSuggestions,
} from "../../../../common/domain/mappers/GooglePlacesMapper";
import type { AddressSearchConfig } from "../../../../common/domain/models/AddressSearchConfig";

const config: AddressSearchConfig = {
  apiKey: "key",
  debounceMs: 500,
  minLength: 3,
  bias: { center: { latitude: 42.05, longitude: 25.6 }, radiusMeters: 15_000 },
};

describe("GooglePlacesMapper", () => {
  it("asks for Bulgarian results ranked around the configured circle", () => {
    expect(toAutocompleteBody("Марица", config, "token")).toEqual({
      input: "Марица",
      languageCode: "bg",
      regionCode: "BG",
      includedRegionCodes: ["bg"],
      sessionToken: "token",
      locationBias: {
        circle: { center: { latitude: 42.05, longitude: 25.6 }, radius: 15_000 },
      },
    });
  });

  it("caps the bias radius at what the provider accepts", () => {
    const body = toAutocompleteBody(
      "x",
      { ...config, bias: { ...config.bias, radiusMeters: 900_000 } },
      "t",
    );

    expect(body.locationBias.circle.radius).toBe(50_000);
  });

  it("reads place proposals and skips query suggestions", () => {
    expect(
      toSuggestions({
        suggestions: [
          {
            placePrediction: {
              placeId: "p1",
              text: { text: "ул. Марица 5, Димитровград, България" },
              structuredFormat: {
                mainText: { text: "ул. Марица 5" },
                secondaryText: { text: "Димитровград, България" },
              },
            },
          },
          { queryPrediction: { text: { text: "марица" } } },
          { placePrediction: { placeId: "p2", text: { text: "Хасково" } } },
          { placePrediction: { text: { text: "no id" } } },
        ],
      }),
    ).toEqual([
      {
        id: "p1",
        label: "ул. Марица 5, Димитровград, България",
        context: "Димитровград, България",
      },
      { id: "p2", label: "Хасково", context: undefined },
    ]);
  });

  it("treats a response without suggestions as no match and rejects malformed ones", () => {
    expect(toSuggestions({})).toEqual([]);
    expect(() => toSuggestions(null)).toThrow();
    expect(() => toSuggestions({ suggestions: "x" })).toThrow();
  });

  it("reads coordinates and rejects an incomplete location", () => {
    expect(
      toCoordinates({ location: { latitude: 42.05, longitude: 25.6 } }),
    ).toEqual({ latitude: 42.05, longitude: 25.6 });
    expect(() => toCoordinates({ location: { latitude: 42.05 } })).toThrow();
    expect(() => toCoordinates({})).toThrow();
  });
});
