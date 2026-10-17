import type { AddressSearchClient } from "../clients/AddressSearchClient";
import { GooglePlacesClient } from "../clients/GooglePlacesClient";
import type { AddressSearchConfig } from "../models/AddressSearchConfig";
import type { AddressSelection } from "../models/AddressSelection";
import type { AddressSuggestion } from "../models/AddressSuggestion";

/** What the UI needs from address search, whatever provider is behind it. */
export interface AddressSearchApi {
  readonly debounceMs: number;
  readonly minLength: number;
  search(text: string, signal: AbortSignal): Promise<AddressSuggestion[]>;
  resolve(
    suggestion: AddressSuggestion,
    signal: AbortSignal,
  ): Promise<AddressSelection>;
}

export class AddressSearchService implements AddressSearchApi {
  readonly debounceMs: number;
  readonly minLength: number;

  constructor(
    config: Pick<AddressSearchConfig, "debounceMs" | "minLength">,
    private readonly client: AddressSearchClient,
  ) {
    this.debounceMs = config.debounceMs;
    this.minLength = config.minLength;
  }

  async search(text: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
    const typed = text.trim();

    return typed.length < this.minLength ? [] : this.client.search(typed, signal);
  }

  async resolve(
    suggestion: AddressSuggestion,
    signal: AbortSignal,
  ): Promise<AddressSelection> {
    return {
      label: suggestion.label,
      coordinates: await this.client.resolve(suggestion, signal),
    };
  }
}

// Dimitrovgrad, Bulgaria: proposals here rank first, other places are still offered.
const DEFAULTS = {
  debounceMs: 500,
  minLength: 3,
  latitude: 42.05,
  longitude: 25.6,
  radiusMeters: 15_000,
};

function isSet(value: unknown): boolean {
  return value !== undefined && value !== "";
}

function positive(value: unknown, fallback: number): number {
  const parsed = Number(value);

  return isSet(value) && Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function finite(value: unknown, fallback: number): number {
  const parsed = Number(value);

  return isSet(value) && Number.isFinite(parsed) ? parsed : fallback;
}

/** Reads the `VITE_*` settings; without a key address search is switched off. */
export function readAddressSearchConfig(
  env: Record<string, unknown>,
): AddressSearchConfig | undefined {
  const apiKey = env.VITE_GOOGLE_PLACES_API_KEY;

  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    return undefined;
  }

  return {
    apiKey: apiKey.trim(),
    debounceMs: positive(env.VITE_ADDRESS_SEARCH_DEBOUNCE_MS, DEFAULTS.debounceMs),
    minLength: DEFAULTS.minLength,
    bias: {
      center: {
        latitude: finite(env.VITE_ADDRESS_BIAS_LAT, DEFAULTS.latitude),
        longitude: finite(env.VITE_ADDRESS_BIAS_LNG, DEFAULTS.longitude),
      },
      radiusMeters: positive(env.VITE_ADDRESS_BIAS_RADIUS_M, DEFAULTS.radiusMeters),
    },
  };
}

/** Address search for the running app, or `undefined` when no provider key is configured. */
export function createAddressSearch(
  env: Record<string, unknown> = import.meta.env,
): AddressSearchApi | undefined {
  const config = readAddressSearchConfig(env);

  return config
    ? new AddressSearchService(config, new GooglePlacesClient(config))
    : undefined;
}
