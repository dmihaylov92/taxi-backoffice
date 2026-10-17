import type { Violation } from "./Violation";

/** Transport-level failure; status 0 means the request never reached the API. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    /** The fields the API refused in a 400, with reasons; empty when it named none. */
    public readonly violations: readonly Violation[] = [],
  ) {
    super("API request failed");
  }
}
