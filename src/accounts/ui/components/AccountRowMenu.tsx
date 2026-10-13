import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../../../common/ui/components/Icon";
import { accountsCopy } from "../assets/copy";

export type RowAction = "edit" | "resend" | "deactivate" | "remove";

interface AccountRowMenuProps {
  accountName: string;
  actions: readonly RowAction[];
  disabled: boolean;
  onSelect: (action: RowAction) => void;
}

/** Overflow menu for one table row; follows the menu-button pattern (arrows, Escape, focus return). */
export function AccountRowMenu({
  accountName,
  actions,
  disabled,
  onSelect,
}: AccountRowMenuProps) {
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
    const items = [
      ...(root.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
        []),
    ];
    const index = items.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case "Escape": {
        event.stopPropagation();
        close();

        break;
      }

      case "ArrowDown": {
        event.preventDefault();
        items[(index + 1) % items.length]?.focus();

        break;
      }

      case "ArrowUp": {
        event.preventDefault();
        items[(index - 1 + items.length) % items.length]?.focus();

        break;
      }

      case "Tab": {
        setOpen(false);

        break;
      }
    }
  }

  if (actions.length === 0) {
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
        aria-label={accountsCopy.actionsFor(accountName)}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <Icon name="more" />
      </button>
      {open && (
        <ul id={menuId} role="menu" className="menu">
          {actions.map((action) => (
            <li key={action} role="none">
              <button
                type="button"
                role="menuitem"
                className={action === "remove" ? "danger" : undefined}
                onClick={() => {
                  // Focus the trigger first so a dialog opened next returns focus here, not to <body>.
                  trigger.current?.focus();
                  setOpen(false);
                  onSelect(action);
                }}
              >
                {accountsCopy.menu[action]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
