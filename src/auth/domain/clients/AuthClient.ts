import { AuthError } from "../models/AuthError";
import type { Identity } from "../models/Identity";

const API_ROOT = "/api/v1/auth";
const CSRF_HEADER = "X-CSRF-Token";

interface CsrfProof {
  token: string;
  headerName: string;
}

/**
 * Talks to the Java API through same-origin HttpOnly cookies. Tokens never reach JavaScript:
 * the browser attaches them, and unsafe requests carry a double-submit CSRF proof.
 */
export class AuthClient {
  constructor(
    private readonly fetcher: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async me(): Promise<Identity> {
    const response = await this.request("me");

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

  private async request(path: string, init?: RequestInit): Promise<Response> {
    let response: Response;

    try {
      response = await this.fetcher(`${API_ROOT}/${path}`, {
        ...init,
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      throw new AuthError(0);
    }

    if (!response.ok) {
      throw new AuthError(response.status);
    }

    return response;
  }

  private async csrf(): Promise<CsrfProof> {
    const response = await this.request("session/csrf");
    const proof = (await response.json()) as CsrfProof;

    if (proof.headerName !== CSRF_HEADER || typeof proof.token !== "string") {
      throw new AuthError(0);
    }

    return proof;
  }

  private async post(path: string, body?: object): Promise<Response> {
    const proof = await this.csrf();
    const headers: Record<string, string> = { [proof.headerName]: proof.token };

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    return this.request(path, {
      method: "POST",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}
