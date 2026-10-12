import { AuthError } from "../models/AuthError";
import type { AuthFailure } from "../models/AuthFailure";
import { isPasswordChange, type AuthMode } from "../models/AuthMode";

export function toAuthFailure(error: unknown, mode: AuthMode): AuthFailure {
  const reset = isPasswordChange(mode);
  const status = error instanceof AuthError ? error.status : 0;

  if (error instanceof AuthError && error.code === "INTEGRATION_PENDING") {
    return { kind: "integrationPending", terminal: false };
  }

  switch (status) {
    case 400: {
      return { kind: "invalid", terminal: false };
    }

    case 401: {
      return { kind: reset ? "invalidLink" : "credentials", terminal: reset };
    }

    case 403: {
      return { kind: "forbidden", terminal: reset };
    }

    case 409: {
      return { kind: reset ? "resetConflict" : "loginConflict", terminal: reset };
    }

    case 413: {
      return { kind: "size", terminal: false };
    }

    case 429: {
      return { kind: "throttled", terminal: false };
    }

    default: {
      return { kind: reset ? "uncertain" : "unavailable", terminal: reset };
    }
  }
}
