import { ApiError } from "../../../common/domain/models/ApiError";

/** Auth transport failure; the optional code lets a client flag special cases such as a pending integration. */
export class AuthError extends ApiError {
  constructor(
    status: number,
    public readonly code = "",
  ) {
    super(status);
  }
}
