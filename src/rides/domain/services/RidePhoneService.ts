import { PHONE_PREFIX } from "../models/RideDraft";

const NATIONAL_DIGITS = 9;

/** Digits of a typed or pasted phone number with the country prefix and separators removed. */
export function nationalDigits(typed: string): string {
  const compact = typed.replace(/[\s().-]/g, "");
  const national = compact.startsWith(PHONE_PREFIX)
    ? compact.slice(PHONE_PREFIX.length)
    : compact;

  return national.replace(/\D/g, "");
}

/** The API accepts `+359` followed by exactly nine digits. */
export function isValidNationalNumber(typed: string): boolean {
  return (
    /^[\d\s().-]*$/.test(typed.replace(PHONE_PREFIX, "")) &&
    nationalDigits(typed).length === NATIONAL_DIGITS
  );
}

/** `+359 888 123 456` for a stored `+359888123456`; anything else is shown as received. */
export function formatPhone(phone: string): string {
  const national = phone.startsWith(PHONE_PREFIX)
    ? phone.slice(PHONE_PREFIX.length)
    : undefined;

  if (!national || !/^\d{9}$/.test(national)) {
    return phone;
  }

  return `${PHONE_PREFIX} ${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
}
