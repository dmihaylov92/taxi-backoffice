import { useState, type InputHTMLAttributes } from "react";
import { common } from "../assets/copy";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

function FieldIcon({ password }: { password: boolean }) {
  return (
    <svg
      className="input-icon"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {password ? (
        <>
          <rect x="5" y="10" width="14" height="11" rx="3" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      ) : (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 6 9 7 9-7" />
        </>
      )}
    </svg>
  );
}

function RevealIcon({ shown }: { shown: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {shown && <path d="m3 3 18 18" />}
    </svg>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
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
      <div className={`input-wrap ${password ? "password" : ""}`}>
        <FieldIcon password={password} />
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
            <RevealIcon shown={shown} />
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
