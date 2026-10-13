import { useEffect, useId, useRef, type ReactNode } from "react";
import { common } from "../assets/copy";
import { Icon } from "./Icon";

interface ModalProps {
  title: string;
  /** Called for Escape, the close button and the backdrop. Ignored while `busy`. */
  onClose: () => void;
  busy?: boolean;
  /** Narrow dialogs suit confirmations; wide ones suit forms. */
  size?: "narrow" | "wide";
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: labelled by its title, traps Tab, closes on Escape and returns focus
 * to the element that opened it. While `busy` the panel itself holds focus (controls are
 * disabled), and when work ends focus moves to an alert or back to the first control.
 */
export function Modal({
  title,
  onClose,
  busy = false,
  size = "wide",
  children,
}: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const wasBusy = useRef(false);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>(
      "[data-autofocus], input, select, textarea",
    );

    (first ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus();

    return () => opener?.focus?.();
  }, []);

  useEffect(() => {
    if (busy) {
      wasBusy.current = true;
      panel.current?.focus();

      return;
    }

    if (!wasBusy.current) {
      return;
    }

    wasBusy.current = false;

    const alert = panel.current?.querySelector<HTMLElement>('[role="alert"]');

    if (alert) {
      alert.tabIndex = -1;
      alert.focus();

      return;
    }

    panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
  }, [busy]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();

      if (!busy) {
        onClose();
      }

      return;
    }

    if (event.key !== "Tab" || !panel.current) {
      return;
    }

    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];

    if (items.length === 0) {
      event.preventDefault();

      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === panel.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <div
        ref={panel}
        className={`modal ${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <header className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="icon-button"
            aria-label={common.close}
            disabled={busy}
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
