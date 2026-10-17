import { useEffect, useId, useRef, useState } from "react";
import type { AddressSelection } from "../../domain/models/AddressSelection";
import type { AddressSuggestion } from "../../domain/models/AddressSuggestion";
import { addressCopy } from "../assets/copy";
import { Icon } from "./Icon";
import { useAddressSearch } from "./AddressSearchProvider";

type Search =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; items: AddressSuggestion[] };

interface AddressAutocompleteProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** Called for every edit of the text, including the label of a chosen proposal. */
  onChange: (value: string) => void;
  /** Called once the place of a chosen proposal is known; edits afterwards invalidate it. */
  onSelect?: (selection: AddressSelection) => void;
}

/**
 * Address input with place proposals, shared by every screen that takes an address. It follows the
 * combobox pattern with a listbox. Without an address search provider it is a plain text input,
 * because the typed address is then stored as written. The provider is reached only through
 * `useAddressSearch`, so replacing it never touches this component.
 */
export function AddressAutocomplete({
  id,
  label,
  value,
  error,
  disabled,
  required,
  onChange,
  onSelect,
}: AddressAutocompleteProps) {
  const service = useAddressSearch();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [search, setSearch] = useState<Search>({ status: "idle" });
  const [lookupFailed, setLookupFailed] = useState(false);
  /** The label just chosen, so choosing it does not immediately search for it again. */
  const chosen = useRef<string>(undefined);
  const lookup = useRef<AbortController>(undefined);
  const searchable = Boolean(service);
  const items = search.status === "ready" ? search.items : [];
  const expanded = open && search.status !== "idle";
  const listVisible = expanded && items.length > 0;
  const errorId = `${id}-error`;

  useEffect(() => {
    const text = value.trim();

    if (!service || !open) {
      return;
    }

    if (text.length < service.minLength || text === chosen.current) {
      setSearch({ status: "idle" });

      return;
    }

    const controller = new AbortController();

    setSearch({ status: "loading" });

    const timer = window.setTimeout(() => {
      service
        .search(text, controller.signal)
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
    }, service.debounceMs);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, open, service]);

  useEffect(() => () => lookup.current?.abort(), []);

  function cancelLookup() {
    lookup.current?.abort();
    setLookupFailed(false);
  }

  function choose(suggestion: AddressSuggestion) {
    cancelLookup();
    chosen.current = suggestion.label;
    onChange(suggestion.label);
    setOpen(false);
    setSearch({ status: "idle" });

    const controller = new AbortController();

    lookup.current = controller;
    service
      ?.resolve(suggestion, controller.signal)
      .then((selection) => {
        if (!controller.signal.aborted) {
          onSelect?.(selection);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLookupFailed(true);
        }
      });
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
            searchable ? addressCopy.searchPlaceholder : addressCopy.placeholder
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
            cancelLookup();
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
                {addressCopy.searching}
              </p>
            )}
            {search.status === "failed" && (
              <p className="address-state" role="alert">
                {addressCopy.failed}
              </p>
            )}
            {search.status === "ready" && items.length === 0 && (
              <p className="address-state" role="status">
                {addressCopy.none}
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
                <p className="hint">{addressCopy.hint}</p>
              </>
            )}
          </div>
        )}
      </div>
      {lookupFailed && (
        <p className="hint" role="status">
          {addressCopy.noCoordinates}
        </p>
      )}
      {error && (
        <p className="error-text" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}
