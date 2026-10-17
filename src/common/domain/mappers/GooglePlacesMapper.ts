import type { AddressSearchConfig } from "../models/AddressSearchConfig";
import type { AddressSuggestion } from "../models/AddressSuggestion";
import type { Coordinates } from "../models/Coordinates";

/** Places API (New) limit for the radius of a location bias circle. */
const MAX_BIAS_RADIUS_METERS = 50_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function textOf(value: unknown): string | undefined {
  if (!isRecord(value) || typeof value.text !== "string") {
    return undefined;
  }

  return value.text.length > 0 ? value.text : undefined;
}

/** Builds the autocomplete request body: Bulgarian results, the configured area ranked first. */
export function toAutocompleteBody(
  text: string,
  config: AddressSearchConfig,
  sessionToken: string,
) {
  return {
    input: text,
    languageCode: "bg",
    regionCode: "BG",
    includedRegionCodes: ["bg"],
    sessionToken,
    locationBias: {
      circle: {
        center: config.bias.center,
        radius: Math.min(config.bias.radiusMeters, MAX_BIAS_RADIUS_METERS),
      },
    },
  };
}

function toSuggestion(entry: unknown): AddressSuggestion[] {
  const prediction = isRecord(entry) ? entry.placePrediction : undefined;

  if (!isRecord(prediction) || typeof prediction.placeId !== "string") {
    return [];
  }

  const label = textOf(prediction.text);

  if (!label) {
    return [];
  }

  const format = isRecord(prediction.structuredFormat)
    ? prediction.structuredFormat
    : undefined;

  return [
    {
      id: prediction.placeId,
      label,
      context: textOf(format?.secondaryText),
    },
  ];
}

/** Reads place proposals and skips query suggestions, which are not addresses. */
export function toSuggestions(raw: unknown): AddressSuggestion[] {
  if (!isRecord(raw)) {
    throw new Error("Unexpected address search response");
  }

  // Google omits the list entirely when nothing matches.
  if (raw.suggestions === undefined) {
    return [];
  }

  if (!Array.isArray(raw.suggestions)) {
    throw new Error("Unexpected address search response");
  }

  return raw.suggestions.flatMap(toSuggestion);
}

/** Reads the coordinates of a place details response. */
export function toCoordinates(raw: unknown): Coordinates {
  const location = isRecord(raw) ? raw.location : undefined;

  if (
    !isRecord(location) ||
    typeof location.latitude !== "number" ||
    typeof location.longitude !== "number" ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    throw new Error("Unexpected place response");
  }

  return { latitude: location.latitude, longitude: location.longitude };
}
