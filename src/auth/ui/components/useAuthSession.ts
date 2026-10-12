import { createContext, useContext } from "react";
import type { Identity } from "../../domain/models/Identity";
import type { AuthApi } from "../../domain/services/AuthService";

export interface AuthSession {
  auth: AuthApi;
  identity: Identity | null;
  booting: boolean;
  sessionError: boolean;
  loggingOut: boolean;
  notice?: string;
  signIn(identity: Identity): void;
  logout(): Promise<void>;
}

export const AuthSessionContext = createContext<AuthSession | null>(null);

export function useAuthSession(): AuthSession {
  const session = useContext(AuthSessionContext);

  if (!session) {
    throw new Error("useAuthSession requires an AuthSessionProvider");
  }

  return session;
}
