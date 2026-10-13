import type { ReactNode } from "react";
import { Modal } from "./Modal";
import { PendingButton } from "./PendingButton";

interface ConfirmDialogProps {
  title: string;
  confirmLabel: string;
  /** Omit for an acknowledgement-only dialog. */
  cancelLabel?: string;
  pendingLabel?: string;
  /** `danger` styles the confirm button as destructive. */
  tone?: "primary" | "danger";
  pending?: boolean;
  /** Failure text shown inside the dialog; the dialog stays open so the user can retry. */
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}

/** Small modal asking the user to confirm (or just acknowledge) one action. */
export function ConfirmDialog({
  title,
  confirmLabel,
  cancelLabel,
  pendingLabel = confirmLabel,
  tone = "primary",
  pending = false,
  error,
  onConfirm,
  onClose,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} size="narrow" busy={pending} onClose={onClose}>
      <div className="modal-body">
        <div className="modal-content">
          {children}
          {error && (
            <p className="banner error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
      <footer className="modal-foot">
        {cancelLabel && (
          <button
            type="button"
            className="btn"
            data-autofocus
            disabled={pending}
            onClick={onClose}
          >
            {cancelLabel}
          </button>
        )}
        <PendingButton
          type="button"
          className={`btn ${tone === "danger" ? "danger" : "primary"}`}
          data-autofocus={cancelLabel ? undefined : true}
          pending={pending}
          pendingLabel={pendingLabel}
          onClick={onConfirm}
        >
          {confirmLabel}
        </PendingButton>
      </footer>
    </Modal>
  );
}
