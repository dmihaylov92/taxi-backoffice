import type { ReactNode } from "react";
import { bg } from "../assets/copy";

export function SubmitButton({
  pending,
  disabled,
  children,
}: {
  pending: boolean;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <button className="btn primary" disabled={disabled}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {bg.pending}
        </>
      ) : (
        children
      )}
    </button>
  );
}
