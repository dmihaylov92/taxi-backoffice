import { ApiError } from "../models/ApiError";
import type { ApiFailure, ApiFailureKind } from "../models/ApiFailure";

function kindFor(status: number | undefined): ApiFailureKind {
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

export function toApiFailure(error: unknown): ApiFailure {
  if (!(error instanceof ApiError)) {
    return { kind: kindFor(undefined) };
  }

  return error.violations.length > 0
    ? { kind: kindFor(error.status), violations: error.violations }
    : { kind: kindFor(error.status) };
}
