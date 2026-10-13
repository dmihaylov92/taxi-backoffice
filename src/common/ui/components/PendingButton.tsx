import type { ButtonHTMLAttributes } from "react";

interface PendingButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  pending: boolean;
  /** Shown with a spinner while pending; the normal label is hidden. */
  pendingLabel: string;
  children: React.ReactNode;
}

/** Button that swaps its label for a spinner and is disabled while its action is pending. */
export function PendingButton({
  pending,
  pendingLabel,
  children,
  disabled,
  ...props
}: PendingButtonProps) {
  return (
    <button {...props} disabled={disabled || pending}>
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
