import { isValidEmail } from "../../../common/domain/services/EmailValidationService";
import type { AuthMode } from "../models/AuthMode";
import type { FormErrors, FormValues } from "../models/FormErrors";

const MAX_PASSWORD_BYTES = 72;
const MIN_NEW_PASSWORD_LENGTH = 12;

export function validate(mode: AuthMode, values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const { email, password, confirm } = values;

  if (mode === "login" || mode === "forgot") {
    if (!isValidEmail(email)) {
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
