import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./Icon";

export interface RowMenuItem<Action extends string> {
  action: Action;
  label: string;
  tone?: "danger";
  icon?: IconName;
  /** Draws a divider above the item, to set a destructive action apart. */
  separated?: boolean;
  /**
   * Keeps the item visible but unavailable and says why. It stays focusable so the reason is
   * reachable by keyboard, and selecting it does nothing.
   */
  disabledReason?: string;
}

interface RowMenuProps<Action extends string> {
  /** Accessible name of the trigger, naming the row it belongs to. */
  triggerLabel: string;
  items: readonly RowMenuItem<Action>[];
  disabled?: boolean;
  onSelect: (action: Action) => void;
}

const MENU_GAP = 4;

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
  const menu = useRef<HTMLUListElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  /** Viewport position of the menu; it is drawn outside the table so overflow cannot clip it. */
  const [position, setPosition] = useState<{ top: number; left: number }>();

  useLayoutEffect(() => {
    if (!open || !trigger.current || !menu.current) {
      setPosition(undefined);

      return;
    }

    const anchor = trigger.current.getBoundingClientRect();
    const size = menu.current.getBoundingClientRect();
    const below = anchor.bottom + MENU_GAP;
    const fitsBelow = below + size.height <= window.innerHeight;
    const top = fitsBelow
      ? below
      : Math.max(MENU_GAP, anchor.top - MENU_GAP - size.height);
    const left = Math.max(
      MENU_GAP,
      Math.min(anchor.right - size.width, window.innerWidth - size.width - MENU_GAP),
    );

    setPosition({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (!root.current?.contains(target) && !menu.current?.contains(target)) {
        setOpen(false);
      }
    }

    // A menu drawn at a fixed spot would drift from its row, so it closes instead.
    function dismiss() {
      setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", dismiss);
    window.addEventListener("scroll", dismiss, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const elements = [
      ...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
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
      {open &&
        createPortal(
        <ul
          ref={menu}
          id={menuId}
          role="menu"
          className="menu"
          style={
            position
              ? { top: position.top, left: position.left }
              : { top: 0, left: 0, visibility: "hidden" }
          }
        >
          {items.map((item) => (
            <Fragment key={item.action}>
              {item.separated && (
                <li role="separator" className="menu-separator" />
              )}
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={item.tone === "danger" ? "danger" : undefined}
                  aria-disabled={item.disabledReason ? true : undefined}
                  aria-describedby={
                    item.disabledReason ? `${menuId}-${item.action}` : undefined
                  }
                  onClick={() => {
                    if (item.disabledReason) {
                      return;
                    }

                    // Focus the trigger first so a dialog opened next returns focus here, not to <body>.
                    trigger.current?.focus();
                    setOpen(false);
                    onSelect(item.action);
                  }}
                >
                  {item.icon && <Icon name={item.icon} size={18} />}
                  <span className="menu-label">
                    {item.label}
                    {item.disabledReason && (
                      <span
                        className="menu-reason"
                        id={`${menuId}-${item.action}`}
                        aria-hidden="true"
                      >
                        {item.disabledReason}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            </Fragment>
          ))}
        </ul>,
          document.body,
        )}
    </div>
  );
}
