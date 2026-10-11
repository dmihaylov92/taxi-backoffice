import { bg } from "./copy";
import { AuthError } from "./contract";
export type Mode = "login" | "forgot" | "reset" | "set";
export function validate(
  mode: Mode,
  email: string,
  password: string,
  confirm: string,
) {
  const errors: Record<string, string> = {};
  if (
    (mode === "login" || mode === "forgot") &&
    (email.length > 254 ||
      !/^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email.trim()))
  )
    errors.email = bg.emailError;
  if (mode !== "forgot") {
    const bytes = new TextEncoder().encode(password).length;
    if (
      !password.trim() ||
      bytes > 72 ||
      (mode !== "login" && password.length < 12)
    )
      errors.password = mode === "login" ? bg.requiredPassword : bg.policy;
    if (mode !== "login" && password !== confirm) errors.confirm = bg.mismatch;
  }
  return errors;
}
export function feedback(error: unknown, mode: Mode) {
  const status = error instanceof AuthError ? error.status : 0;
  if (error instanceof AuthError && error.code === "INTEGRATION_PENDING")
    return { text: bg.integrationPending, terminal: false };
  const reset = mode === "reset" || mode === "set";
  if (status === 401)
    return {
      text: reset ? bg.invalidLinkSub : bg.credentials,
      terminal: reset,
    };
  if (status === 409)
    return {
      text: reset ? bg.resetConflict : bg.loginConflict,
      terminal: reset,
    };
  if (status === 429) return { text: bg.throttled, terminal: false };
  if (status === 400) return { text: bg.invalid, terminal: false };
  if (status === 413) return { text: bg.size, terminal: false };
  if (status === 403) return { text: bg.forbidden, terminal: reset };
  return { text: reset ? bg.uncertain : bg.unavailable, terminal: reset };
}
