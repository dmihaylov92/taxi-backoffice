import type { ReactNode } from "react";
import type { ApiFailureKind } from "../../domain/models/ApiFailure";
import { useApiAction } from "../hooks/useApiAction";
import { ConfirmDialog } from "./ConfirmDialog";

export interface ConfirmRemoveCopy {
  title: string;
  body: string;
  confirm: string;
  cancel: string;
  pending: string;
}

interface ConfirmRemoveDialogProps {
  copy: ConfirmRemoveCopy;
  failureText: Record<ApiFailureKind, string>;
  /** Names the entity about to be removed. */
  target: ReactNode;
  /** Rejects when the API does not confirm the deletion. */
  onConfirm: () => Promise<void>;
  onClose: () => void;
  onUnauthenticated: () => void;
}

/** Destructive confirmation that stays open and explains the failure when the API refuses. */
export function ConfirmRemoveDialog({
  copy,
  failureText,
  target,
  onConfirm,
  onClose,
  onUnauthenticated,
}: ConfirmRemoveDialogProps) {
  const action = useApiAction(onUnauthenticated);

  return (
    <ConfirmDialog
      title={copy.title}
      tone="danger"
      confirmLabel={copy.confirm}
      cancelLabel={copy.cancel}
      pendingLabel={copy.pending}
      pending={action.pending}
      error={action.failure ? failureText[action.failure.kind] : undefined}
      onConfirm={() => void action.run(onConfirm)}
      onClose={onClose}
    >
      <p>{copy.body}</p>
      {target}
    </ConfirmDialog>
  );
}
