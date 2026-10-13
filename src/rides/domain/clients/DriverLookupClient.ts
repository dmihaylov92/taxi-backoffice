import { ApiClient } from "../../../common/domain/clients/ApiClient";

const API_ROOT = "/api/v1/accounts";

/** Looks up active driver accounts for assignment through the administrator accounts endpoint. */
export class DriverLookupClient {
  constructor(private readonly api: ApiClient = new ApiClient()) {}

  /** `text` is a single fragment of an email or name; the API matches one fragment at a time. */
  async search(
    text: string,
    size: number,
    signal?: AbortSignal,
  ): Promise<unknown> {
    const query = new URLSearchParams({ role: "DRIVER", status: "ACTIVE" });

    if (text) {
      query.set("q", text);
    }

    query.set("page", "0");
    query.set("size", String(size));

    const response = await this.api.get(`${API_ROOT}?${query}`, signal);

    return response.json();
  }
}
