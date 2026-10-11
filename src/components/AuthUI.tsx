import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { bg, brand } from "../auth/copy";
export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">
        Към съдържанието
      </a>
      <div className="auth">
        <aside className="auth-aside">
          <div className="brand">
            <img src={brand.logo} alt="" />
            <span>{brand.name}</span>
          </div>
          <h2>{bg.login}</h2>
        </aside>
        <main id="main" tabIndex={-1}>
          <section className="auth-card">
            <div className="eyebrow">{bg.area}</div>
            {children}
          </section>
        </main>
      </div>
    </>
  );
}
interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
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
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={password ? "password" : undefined}>
        <input
          {...props}
          id={id}
          type={password && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [hint && `${id}-hint`, error && `${id}-error`]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        {password && (
          <button
            type="button"
            className="reveal"
            aria-controls={id}
            aria-pressed={shown}
            aria-label={`${shown ? bg.hide : bg.show}: ${label}`}
            onClick={() => setShown(!shown)}
          >
            {shown ? bg.hide : bg.show}
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
