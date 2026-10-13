import { useState, type InputHTMLAttributes } from "react";
import { common } from "../assets/copy";
import { Icon } from "./Icon";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  /** Leading icon; the mail/lock glyph is on by default and off for plain text such as names. */
  icon?: boolean;
}

export function Field({
  id,
  label,
  hint,
  error,
  icon = true,
  type = "text",
  ...props
}: FieldProps) {
  const [shown, setShown] = useState(false);
  const password = type === "password";
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div
        className={["input-wrap", password && "password", !icon && "plain"]
          .filter(Boolean)
          .join(" ")}
      >
        {icon && (
          <Icon
            className="input-icon"
            name={password ? "lock" : "mail"}
            size={18}
          />
        )}
        <input
          {...props}
          id={id}
          type={password && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        {password && (
          <button
            type="button"
            className="reveal"
            aria-controls={id}
            aria-pressed={shown}
            disabled={props.disabled}
            aria-label={`${shown ? common.hide : common.show}: ${label}`}
            onClick={() => setShown(!shown)}
          >
            <Icon name={shown ? "eyeOff" : "eye"} />
          </button>
        )}
      </div>
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="error-text" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
