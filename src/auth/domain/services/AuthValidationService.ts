import type { AuthMode } from "../models/AuthMode";
import type { FormErrors, FormValues } from "../models/FormErrors";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_BYTES = 72;
const MIN_NEW_PASSWORD_LENGTH = 12;
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function validate(mode: AuthMode, values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const { email, password, confirm } = values;

  if (mode === "login" || mode === "forgot") {
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email.trim())) {
      errors.email = "emailInvalid";
    }
  }

  if (mode === "forgot") {
    return errors;
  }

  const bytes = new TextEncoder().encode(password).length;
  const tooShort = mode !== "login" && password.length < MIN_NEW_PASSWORD_LENGTH;

  if (!password.trim() || bytes > MAX_PASSWORD_BYTES || tooShort) {
    errors.password = mode === "login" ? "passwordRequired" : "passwordPolicy";
  }

  if (mode !== "login" && password !== confirm) {
    errors.confirm = "passwordMismatch";
  }

  return errors;
}
