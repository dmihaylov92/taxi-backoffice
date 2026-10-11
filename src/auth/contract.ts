export interface Identity {
  id: string;
  email: string;
  roles: ("ADMIN" | "DISPATCHER" | "DRIVER")[];
}
export interface AuthPort {
  login(email: string, password: string): Promise<Identity>;
  forgot(email: string): Promise<void>;
  reset(token: string, password: string): Promise<void>;
  logout(): Promise<boolean>;
}
export class AuthError extends Error {
  constructor(
    public readonly status: number,
    public readonly code = "",
  ) {
    super("Authentication request failed");
  }
}
// Fail closed until the session/origin contract is agreed. No synthetic success in the application.
export const pendingAuth: AuthPort = {
  login: async () => {
    throw new AuthError(0, "INTEGRATION_PENDING");
  },
  forgot: async () => {
    throw new AuthError(0, "INTEGRATION_PENDING");
  },
  reset: async () => {
    throw new AuthError(0, "INTEGRATION_PENDING");
  },
  logout: async () => false,
};
