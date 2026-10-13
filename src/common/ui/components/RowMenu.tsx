import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon";

export interface RowMenuItem<Action extends string> {
  action: Action;
  label: string;
  tone?: "danger";
}

interface RowMenuProps<Action extends string> {
  /** Accessible name of the trigger, naming the row it belongs to. */
  triggerLabel: string;
  items: readonly RowMenuItem<Action>[];
  disabled?: boolean;
  onSelect: (action: Action) => void;
}

/** Overflow menu for one table row; follows the menu-button pattern (arrows, Escape, focus return). */
export function RowMenu<Action extends string>({
  triggerLabel,
  items,
  disabled,
  onSelect,
}: RowMenuProps<Action>) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function onPointerDown(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);

    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const elements = [
      ...(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
        []),
    ];
    const index = elements.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "Escape": {
        event.stopPropagation();
        close();

        break;
      }

      case "ArrowDown": {
        event.preventDefault();
        elements[(index + 1) % elements.length]?.focus();

        break;
      }

      case "ArrowUp": {
        event.preventDefault();
        elements[(index - 1 + elements.length) % elements.length]?.focus();

        break;
      }

      case "Tab": {
        setOpen(false);

        break;
      }
    }
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="row-menu" ref={root} onKeyDown={open ? onKeyDown : undefined}>
      <button
        ref={trigger}
        type="button"
        className="icon-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={triggerLabel}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <ul id={menuId} role="menu" className="menu">
          {items.map((item) => (
            <li key={item.action} role="none">
              <button
                type="button"
                role="menuitem"
                className={item.tone === "danger" ? "danger" : undefined}
                onClick={() => {
                  // Focus the trigger first so a dialog opened next returns focus here, not to <body>.
                  trigger.current?.focus();
                  setOpen(false);
                  onSelect(item.action);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
