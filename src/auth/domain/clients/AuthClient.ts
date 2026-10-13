import { ApiClient } from "../../../common/domain/clients/ApiClient";
import { AuthError } from "../models/AuthError";
import type { Identity } from "../models/Identity";

const API_ROOT = "/api/v1/auth";

/**
 * Talks to the Java API through same-origin HttpOnly cookies. Tokens never reach JavaScript:
 * the browser attaches them, and unsafe requests carry a double-submit CSRF proof.
 */
export class AuthClient {
  private readonly api: ApiClient;

  constructor(fetcher: typeof fetch = (input, init) => fetch(input, init)) {
    this.api = new ApiClient({
      fetcher,
      errorFor: (status) => new AuthError(status),
    });
  }

  async me(): Promise<Identity> {
    const response = await this.api.get(`${API_ROOT}/me`);

    return (await response.json()) as Identity;
  }

  async login(email: string, password: string): Promise<void> {
    await this.post("session", { email, password });
  }

  async refresh(): Promise<void> {
    await this.post("session/refresh");
  }

  async logout(): Promise<void> {
    await this.post("session/logout");
  }

  async forgot(email: string): Promise<void> {
    await this.post("forgot-password", { email });
  }

  async reset(token: string, password: string): Promise<void> {
    await this.post("reset-password", { token, password });
  }

  private post(path: string, body?: object): Promise<Response> {
    return this.api.send("POST", `${API_ROOT}/${path}`, body);
  }
}
