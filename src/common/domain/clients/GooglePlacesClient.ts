import {
  toAutocompleteBody,
  toCoordinates,
  toSuggestions,
} from "../mappers/GooglePlacesMapper";
import type { AddressSearchConfig } from "../models/AddressSearchConfig";
import type { AddressSuggestion } from "../models/AddressSuggestion";
import type { Coordinates } from "../models/Coordinates";
import type { AddressSearchClient } from "./AddressSearchClient";

const BASE_URL = "https://places.googleapis.com/v1";

function newSessionToken(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  // `randomUUID` exists only in secure contexts, and the backoffice may be served over plain HTTP.
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Google Places API (New) over REST. This is the only file that knows the provider; replacing it
 * means implementing `AddressSearchClient` again and wiring it in `createAddressSearch`.
 *
 * One session token groups the autocomplete requests and the place lookup that ends them into a
 * single billed session; it is renewed after every lookup.
 */
export class GooglePlacesClient implements AddressSearchClient {
  private sessionToken = newSessionToken();

  constructor(
    private readonly config: AddressSearchConfig,
    private readonly send: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async search(text: string, signal: AbortSignal): Promise<AddressSuggestion[]> {
    const response = await this.send(`${BASE_URL}/places:autocomplete`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.config.apiKey,
      },
      body: JSON.stringify(
        toAutocompleteBody(text, this.config, this.sessionToken),
      ),
    });

    return toSuggestions(await this.read(response));
  }

  async resolve(
    suggestion: AddressSuggestion,
    signal: AbortSignal,
  ): Promise<Coordinates> {
    const query = new URLSearchParams({
      sessionToken: this.sessionToken,
      languageCode: "bg",
    });
    const response = await this.send(
      `${BASE_URL}/places/${encodeURIComponent(suggestion.id)}?${query}`,
      {
        signal,
        headers: {
          "X-Goog-Api-Key": this.config.apiKey,
          // Only the location is requested; the label is already known from the proposal.
          "X-Goog-FieldMask": "location",
        },
      },
    );

    // The session ends with the lookup, whether or not it succeeded.
    this.sessionToken = newSessionToken();

    return toCoordinates(await this.read(response));
  }

  private async read(response: Response): Promise<unknown> {
    if (!response.ok) {
      throw new Error(`Address search failed with status ${response.status}`);
    }

    return response.json();
  }
}
