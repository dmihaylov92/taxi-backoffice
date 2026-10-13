import { ApiError } from "../../../common/domain/models/ApiError";
import type {
  AccountFailure,
  AccountFailureKind,
} from "../models/AccountFailure";

function kindFor(status: number | undefined): AccountFailureKind {
  switch (status) {
    case 0: {
      return "offline";
    }

    case 400: {
      return "invalid";
    }

    case 401: {
      return "unauthenticated";
    }

    case 403: {
      return "forbidden";
    }

    case 404: {
      return "notFound";
    }

    case 409: {
      return "conflict";
    }

    case 413: {
      return "size";
    }

    case 429: {
      return "throttled";
    }

    default: {
      return "unavailable";
    }
  }
}

export function toAccountFailure(error: unknown): AccountFailure {
  return { kind: kindFor(error instanceof ApiError ? error.status : undefined) };
}
