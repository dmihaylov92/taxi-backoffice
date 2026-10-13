import type { ReactNode } from "react";
import { PendingButton } from "../../../common/ui/components/PendingButton";
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
    <PendingButton
      className="btn primary"
      pending={pending}
      pendingLabel={bg.pending}
      disabled={disabled}
    >
      {children}
    </PendingButton>
  );
}
