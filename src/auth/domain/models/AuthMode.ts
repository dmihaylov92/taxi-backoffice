export type AuthMode = "login" | "forgot" | "reset" | "set";

export function isPasswordChange(mode: AuthMode): boolean {
  return mode === "reset" || mode === "set";
}
