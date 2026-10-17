import type { Violation } from "../models/Violation";
import { VIOLATION_REASONS, type ViolationReason } from "../models/ViolationReason";

/** Which form field shows the refusal of each request field; several request fields may share one. */
export type FieldMap<Field extends string> = Readonly<Record<string, Field>>;

export type RejectedFields<Field extends string> = Partial<
  Record<Field, ViolationReason>
>;

function toReason(code: string): ViolationReason {
  return (
    VIOLATION_REASONS.find((reason) => reason === code) ?? "INVALID"
  );
}

/**
 * Turns the fields the API refused into one reason per form field. Request fields the form has no
 * input for are ignored, a reason this client does not know counts as `INVALID`, and the first
 * reason for a form field wins.
 */
export function toRejectedFields<Field extends string>(
  violations: readonly Violation[],
  fieldMap: FieldMap<Field>,
): RejectedFields<Field> {
  const rejected: RejectedFields<Field> = {};

  for (const { field, code } of violations) {
    if (!Object.hasOwn(fieldMap, field)) {
      continue;
    }

    const formField = fieldMap[field];

    rejected[formField] ??= toReason(code);
  }

  return rejected;
}
