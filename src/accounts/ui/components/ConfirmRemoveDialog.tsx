import { ConfirmDialog } from "../../../common/ui/components/ConfirmDialog";
import { accountFailureText, accountsCopy } from "../assets/copy";
import { useAccountAction } from "./useAccountAction";

interface ConfirmRemoveDialogProps {
  name: string;
  email: string;
  /** Rejects when the API does not confirm the deletion. */
  onConfirm: () => Promise<void>;
  onClose: () => void;
  onUnauthenticated: () => void;
}

export function ConfirmRemoveDialog({
  name,
  email,
  onConfirm,
  onClose,
  onUnauthenticated,
}: ConfirmRemoveDialogProps) {
  const action = useAccountAction(onUnauthenticated);

  return (
    <ConfirmDialog
      title={accountsCopy.remove.title}
      tone="danger"
      confirmLabel={accountsCopy.remove.confirm}
      cancelLabel={accountsCopy.cancel}
      pendingLabel={accountsCopy.pending}
      pending={action.pending}
      error={
        action.failure ? accountFailureText[action.failure.kind] : undefined
      }
      onConfirm={() => void action.run(onConfirm)}
      onClose={onClose}
    >
      <p>{accountsCopy.remove.body}</p>
      <p className="remove-target">
        <strong>{name}</strong>
        <span className="muted">{email}</span>
      </p>
    </ConfirmDialog>
  );
}
