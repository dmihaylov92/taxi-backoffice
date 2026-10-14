import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../../../common/ui/components/Icon";
import { useLatest } from "../../../common/ui/hooks/useLatest";
import type { AddressSuggestion } from "../../domain/models/AddressSuggestion";
import { ridesCopy } from "../assets/rideCopy";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 3;

type Search =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; items: AddressSuggestion[] };

interface AddressFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /**
   * Looks up proposals for the typed text. Without it the field is a plain text input, because
   * no address provider is configured and the typed address is stored as written.
   */
  suggest?: (
    text: string,
    signal: AbortSignal,
  ) => Promise<AddressSuggestion[]>;
  onChange: (value: string) => void;
}

/** Address input that, when a provider is available, follows the combobox pattern with a listbox. */
export function AddressField({
  id,
  label,
  value,
  error,
  disabled,
  required,
  suggest,
  onChange,
}: AddressFieldProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [search, setSearch] = useState<Search>({ status: "idle" });
  /** The label just chosen, so choosing it does not immediately search for it again. */
  const chosen = useRef<string>(undefined);
  const lookup = useLatest(suggest);
  const searchable = Boolean(suggest);
  const items = search.status === "ready" ? search.items : [];
  const expanded = open && search.status !== "idle";
  const listVisible = expanded && items.length > 0;
  const errorId = `${id}-error`;

  useEffect(() => {
    const text = value.trim();

    if (!searchable || !open) {
      return;
    }

    if (text.length < MIN_SEARCH_LENGTH || text === chosen.current) {
      setSearch({ status: "idle" });

      return;
    }

    const controller = new AbortController();

    setSearch({ status: "loading" });

    const timer = window.setTimeout(() => {
      lookup
        .current?.(text, controller.signal)
        .then((found) => {
          if (!controller.signal.aborted) {
            setActive(-1);
            setSearch({ status: "ready", items: found });
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setSearch({ status: "failed" });
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, open, searchable, lookup]);

  function choose(suggestion: AddressSuggestion) {
    chosen.current = suggestion.label;
    onChange(suggestion.label);
    setOpen(false);
    setSearch({ status: "idle" });
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown": {
        if (!searchable) {
          return;
        }

        event.preventDefault();
        setOpen(true);
        setActive((current) => Math.min(current + 1, items.length - 1));

        break;
      }

      case "ArrowUp": {
        if (!listVisible) {
          return;
        }

        event.preventDefault();
        setActive((current) => Math.max(current - 1, 0));

        break;
      }

      case "Enter": {
        // Choosing a proposal must not also submit the surrounding form.
        if (listVisible && items[active]) {
          event.preventDefault();
          choose(items[active]);
        }

        break;
      }

      case "Escape": {
        // The first Escape closes the proposals, not the dialog that contains them.
        if (expanded) {
          event.stopPropagation();
          setOpen(false);
        }

        break;
      }
    }
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap address-wrap">
        <Icon className="input-icon" name="pin" size={18} />
        <input
          id={id}
          type="text"
          autoComplete="off"
          spellCheck={false}
          maxLength={220}
          required={required}
          disabled={disabled}
          value={value}
          placeholder={
            searchable
              ? ridesCopy.form.addressSearchPlaceholder
              : ridesCopy.form.addressPlaceholder
          }
          role={searchable ? "combobox" : undefined}
          aria-autocomplete={searchable ? "list" : undefined}
          aria-expanded={searchable ? listVisible : undefined}
          aria-controls={searchable && listVisible ? listId : undefined}
          aria-activedescendant={
            listVisible && active >= 0 ? `${listId}-${active}` : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            chosen.current = undefined;
            setOpen(true);
            onChange(event.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setOpen(false)}
        />
        {expanded && (
          <div className="address-popup">
            {search.status === "loading" && (
              <p className="address-state" role="status">
                <span className="spinner" aria-hidden="true" />
                {ridesCopy.addresses.searching}
              </p>
            )}
            {search.status === "failed" && (
              <p className="address-state" role="alert">
                {ridesCopy.addresses.failed}
              </p>
            )}
            {search.status === "ready" && items.length === 0 && (
              <p className="address-state" role="status">
                {ridesCopy.addresses.none}
              </p>
            )}
            {items.length > 0 && (
              <>
                <ul id={listId} role="listbox" aria-label={label}>
                  {items.map((item, index) => (
                    <li
                      key={item.id}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={index === active}
                      className={index === active ? "active" : undefined}
                      // Keeps focus in the input so the blur handler does not close the list first.
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(item)}
                    >
                      <Icon name="pin" size={16} />
                      <span>
                        <span className="address-label">{item.label}</span>
                        {item.context && (
                          <span className="muted">{item.context}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="hint">{ridesCopy.addresses.hint}</p>
              </>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="error-text" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
