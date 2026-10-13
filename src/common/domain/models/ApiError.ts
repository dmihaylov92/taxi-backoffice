/** Transport-level failure; status 0 means the request never reached the API. */
export class ApiError extends Error {
  constructor(public readonly status: number) {
    super("API request failed");
  }
}
