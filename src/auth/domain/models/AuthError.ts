export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code = "",
  ) {
    super("Authentication request failed");
  }
}
