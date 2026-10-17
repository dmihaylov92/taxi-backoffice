import { useCallback, useEffect, useState } from "react";
import {
  toRejectedFields,
  type FieldMap,
  type RejectedFields,
} from "../../domain/mappers/ViolationMapper";
import type { ApiFailure } from "../../domain/models/ApiFailure";
import type { ViolationReason } from "../../domain/models/ViolationReason";
import { violationText } from "../assets/copy";
import { useLatest } from "./useLatest";

interface RejectedFieldsOptions<Field extends string> {
  failure: ApiFailure | null;
  /** Request field name to the form field that shows its refusal. */
  fieldMap: FieldMap<Field>;
  /** The form fields in display order; the first refused one receives focus. */
  order: readonly Field[];
  ids: Readonly<Record<Field, string>>;
  /** Wording for a field and reason that should replace the shared default. */
  messages?: Partial<Record<Field, Partial<Record<ViolationReason, string>>>>;
  /** Called with the first refused field, for forms that must reveal it (for example a wizard step). */
  onRejected?: (first: Field) => void;
}

/**
 * Shows the fields an API 400 refused beside their inputs: the form plugs in its field map and
 * copy, this does the rest (reason per field, default wording, focus, dismissal on edit).
 */
export function useRejectedFields<Field extends string>(
  options: RejectedFieldsOptions<Field>,
) {
  const latest = useLatest(options);
  const [rejected, setRejected] = useState<RejectedFields<Field>>({});
  const violations =
    options.failure?.kind === "invalid" ? options.failure.violations : undefined;

  useEffect(() => {
    if (!violations) {
      setRejected({});

      return;
    }

    const { fieldMap, order, ids, onRejected } = latest.current;
    const found = toRejectedFields(violations, fieldMap);
    const first = order.find((field) => found[field]);

    setRejected(found);

    if (first) {
      document.getElementById(ids[first])?.focus();
      onRejected?.(first);
    }
  }, [violations, latest]);

  const dismiss = useCallback((field: Field) => {
    setRejected((current) => {
      const next = { ...current };

      delete next[field];

      return next;
    });
  }, []);

  function messageFor(field: Field): string | undefined {
    const reason = rejected[field];

    return reason
      ? (latest.current.messages?.[field]?.[reason] ?? violationText[reason])
      : undefined;
  }

  return { messageFor, dismiss };
}
