import { isValidEmail } from "../../../common/domain/services/EmailValidationService";
import type {
  AccountDraft,
  DraftErrors,
  DraftField,
} from "../models/AccountDraft";

const MAX_NAME_LENGTH = 100;
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;

function isValidName(value: string): boolean {
  const trimmed = value.trim();

  return (
    trimmed.length === 0 ||
    (trimmed.length <= MAX_NAME_LENGTH && !CONTROL_CHARACTERS.test(trimmed))
  );
}

/** Mirrors the API policy so that obvious mistakes are caught before a request is sent. */
export function validateDraft(
  draft: AccountDraft,
  fields: readonly DraftField[],
): DraftErrors {
  const errors: DraftErrors = {};

  for (const field of fields) {
    switch (field) {
      case "email": {
        if (!isValidEmail(draft.email)) {
          errors.email = "emailInvalid";
        }

        break;
      }

      case "firstName":
      case "lastName": {
        if (!isValidName(draft[field])) {
          errors[field] = "nameInvalid";
        }

        break;
      }

      case "roles": {
        if (draft.roles.length === 0) {
          errors.roles = "rolesRequired";
        }

        break;
      }
    }
  }

  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.keys(errors).length > 0;
}
