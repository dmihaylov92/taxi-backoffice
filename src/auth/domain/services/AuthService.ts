import { AuthClient } from "../clients/AuthClient";
import { AuthError } from "../models/AuthError";
import type { Identity } from "../models/Identity";

export interface AuthApi {
  session?(): Promise<Identity | null>;
  login(email: string, password: string): Promise<Identity>;
  forgot(email: string): Promise<void>;
  reset(token: string, password: string): Promise<void>;
  logout(): Promise<boolean>;
}

const REFRESH_LOCK = "taxi-auth-refresh";

function isUnauthenticated(error: unknown): boolean {
  return error instanceof AuthError && error.status === 401;
}

/**
 * Refresh tokens are single-use and a replay revokes the whole session, so only one tab at a time
 * may rotate. Falls back to running directly where the Web Locks API is unavailable.
 */
function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return task();
  }

  return navigator.locks.request(REFRESH_LOCK, task);
}

export class AuthService implements AuthApi {
  private restoration?: Promise<Identity | null>;

  constructor(private readonly client: AuthClient = new AuthClient()) {}

  session(): Promise<Identity | null> {
    this.restoration ??= this.restore().finally(() => {
      this.restoration = undefined;
    });

    return this.restoration;
  }

  async login(email: string, password: string): Promise<Identity> {
    await this.client.login(email, password);

    return this.client.me();
  }

  forgot(email: string): Promise<void> {
    return this.client.forgot(email);
  }

  reset(token: string, password: string): Promise<void> {
    return this.client.reset(token, password);
  }

  async logout(): Promise<boolean> {
    await this.client.logout();

    return true;
  }

  private async restore(): Promise<Identity | null> {
    try {
      return await this.client.me();
    } catch (error) {
      if (!isUnauthenticated(error)) {
        throw error;
      }
    }

    return withRefreshLock(() => this.refreshSession());
  }

  /** Re-checks identity under the lock: another tab may already have rotated the cookies. */
  private async refreshSession(): Promise<Identity | null> {
    try {
      return await this.client.me();
    } catch (error) {
      if (!isUnauthenticated(error)) {
        throw error;
      }
    }

    try {
      await this.client.refresh();
    } catch (error) {
      if (isUnauthenticated(error)) {
        return null;
      }

      throw error;
    }

    return this.client.me();
  }
}

export const authService = new AuthService();
