import type { ReactNode } from "react";
import { ConfirmDialog } from "../../../common/ui/components/ConfirmDialog";
import { useApiAction } from "../../../common/ui/hooks/useApiAction";
import {
  ridesCopy,
  rideFailureText,
  STALE_FAILURES,
} from "../assets/rideCopy";

interface RideActionDialogProps {
  title: string;
  tone: "primary" | "danger";
  confirmLabel: string;
  pendingLabel: string;
  /** Rejects when the API does not confirm the change; the dialog stays open and shows why. */
  onConfirm: () => Promise<void>;
  /** The visible list is stale; the host reloads it and closes the dialog. */
  onReload: () => void;
  onClose: () => void;
  onUnauthenticated: () => void;
  children: ReactNode;
}

/**
 * Confirmation for one ride operation. "Назад" dismisses, so it cannot be mistaken for the
 * rejection ("Откажи") it may be confirming.
 */
export function RideActionDialog({
  title,
  tone,
  confirmLabel,
  pendingLabel,
  onConfirm,
  onReload,
  onClose,
  onUnauthenticated,
  children,
}: RideActionDialogProps) {
  const action = useApiAction(onUnauthenticated);
  const kind = action.failure?.kind;

  return (
    <ConfirmDialog
      title={title}
      tone={tone}
      confirmLabel={confirmLabel}
      cancelLabel={ridesCopy.back}
      pendingLabel={pendingLabel}
      pending={action.pending}
      onConfirm={() => void action.run(onConfirm)}
      onClose={onClose}
    >
      {children}
      {kind && (
        <div className="banner error with-action" role="alert">
          <span>{rideFailureText[kind]}</span>
          {STALE_FAILURES.includes(kind) && (
            <button type="button" className="btn" onClick={onReload}>
              {ridesCopy.reload}
            </button>
          )}
        </div>
      )}
    </ConfirmDialog>
  );
}
