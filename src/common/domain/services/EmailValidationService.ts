const MAX_EMAIL_LENGTH = 254;
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$/;

/**
 * Mirrors the API's email policy: the original text is length-checked, the trimmed text must match.
 * Shared so login, recovery and account forms cannot drift apart.
 */
export function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email.trim());
}
