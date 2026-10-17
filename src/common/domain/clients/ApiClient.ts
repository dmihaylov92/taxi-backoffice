import { ApiError } from "../models/ApiError";
import type { Violation } from "../models/Violation";

const CSRF_PATH = "/api/v1/auth/session/csrf";
const CSRF_HEADER = "X-CSRF-Token";

interface CsrfProof {
  token: string;
  headerName: string;
}

export interface ApiClientOptions {
  fetcher?: typeof fetch;
  /** Builds the error thrown for a failed request, so slices can keep their own error type. */
  errorFor?: (status: number, violations?: readonly Violation[]) => Error;
  /**
   * Called once when a request is rejected as unauthenticated. Resolves true when the session
   * was renewed and the request may be replayed.
   */
  recover?: () => Promise<boolean>;
}

function isViolation(value: unknown): value is Violation {
  return (
    typeof value === "object" &&
    value !== null &&
    "field" in value &&
    typeof value.field === "string" &&
    "code" in value &&
    typeof value.code === "string"
  );
}

/**
 * The `errors` of a 400 problem body (field and reason per refused field). The body is optional,
 * so anything unreadable means none.
 */
async function readViolations(response: Response): Promise<Violation[]> {
  if (response.status !== 400) {
    return [];
  }

  try {
    const body: unknown = await response.json();
    const errors =
      typeof body === "object" && body !== null && "errors" in body
        ? body.errors
        : undefined;

    return Array.isArray(errors) ? errors.filter(isViolation) : [];
  } catch {
    return [];
  }
}

type UnsafeMethod = "POST" | "PUT" | "DELETE";

/**
 * Same-origin JSON transport for the Java API. Credentials are HttpOnly cookies attached by the
 * browser; unsafe methods carry a double-submit CSRF proof fetched fresh for every attempt.
 */
export class ApiClient {
  private readonly fetcher: typeof fetch;
  private readonly errorFor: (
    status: number,
    violations?: readonly Violation[],
  ) => Error;
  private readonly recover?: () => Promise<boolean>;
  /** Proof reused across unsafe requests; dropped when the API rejects it or the session renews. */
  private proof?: CsrfProof;
  /** True when the latest unsafe request used the cached proof rather than a fresh one. */
  private reusedProof = false;

  constructor(options: ApiClientOptions = {}) {
    this.fetcher = options.fetcher ?? ((input, init) => fetch(input, init));
    this.errorFor =
      options.errorFor ??
      ((status, violations) => new ApiError(status, violations));
    this.recover = options.recover;
  }

  get(path: string, signal?: AbortSignal): Promise<Response> {
    return this.execute(path, async () => ({ signal }));
  }

  send(method: UnsafeMethod, path: string, body?: object): Promise<Response> {
    return this.execute(path, async (freshProof) => {
      const proof = await this.csrf(freshProof);
      const headers: Record<string, string> = {
        [proof.headerName]: proof.token,
      };

      if (body) {
        headers["Content-Type"] = "application/json";
      }

      return {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      };
    });
  }

  private async execute(
    path: string,
    build: (freshProof: boolean) => Promise<RequestInit>,
  ): Promise<Response> {
    this.reusedProof = false;

    let response = await this.fetchOnce(path, await build(false));

    // A cached proof may predate a session change; the API answers 403 and one fresh proof settles it.
    if (response.status === 403 && this.reusedProof) {
      this.proof = undefined;
      response = await this.fetchOnce(path, await build(true));
    }

    if (response.status === 401 && this.recover && (await this.recover())) {
      this.proof = undefined;
      response = await this.fetchOnce(path, await build(true));
    }

    if (!response.ok) {
      throw this.errorFor(response.status, await readViolations(response));
    }

    return response;
  }

  private async fetchOnce(path: string, init: RequestInit): Promise<Response> {
    try {
      return await this.fetcher(path, {
        ...init,
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      throw this.errorFor(0);
    }
  }

  private async csrf(fresh: boolean): Promise<CsrfProof> {
    if (!fresh && this.proof) {
      this.reusedProof = true;

      return this.proof;
    }

    this.reusedProof = false;

    const response = await this.fetchOnce(CSRF_PATH, {});

    if (!response.ok) {
      throw this.errorFor(response.status);
    }

    const proof = (await response.json()) as CsrfProof;

    if (proof.headerName !== CSRF_HEADER || typeof proof.token !== "string") {
      throw this.errorFor(0);
    }

    this.proof = proof;

    return proof;
  }
}
