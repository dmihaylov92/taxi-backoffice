import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { brand, common, shell } from "../assets/copy";

export interface NavItem {
  label: string;
  /** Modules without a screen are shown as visibly unavailable rather than pretending. */
  to?: string;
}

interface AppShellProps {
  email: string;
  roleLabel: string;
  loggingOut: boolean;
  onLogout: () => void;
  /** Only modules the account may open; hidden ones never appear. */
  items: readonly NavItem[];
  /** Shown in the top bar before the user, for example the live connection state. */
  status?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  items,
  email,
  roleLabel,
  loggingOut,
  onLogout,
  status,
  children,
}: AppShellProps) {
  return (
    <>
      <a className="skip" href="#main">
        {common.skip}
      </a>
      <div className="shell">
        <aside className="shell-side">
          <div className="brand">
            <span className="checker" aria-hidden="true" />
            {brand.name}
          </div>
          <nav aria-label={shell.navLabel}>
            <ul>
              {items.map((entry) => (
                <li key={entry.label}>
                  {entry.to ? (
                    <NavLink to={entry.to} className="nav-item">
                      {entry.label}
                    </NavLink>
                  ) : (
                    <span className="nav-item disabled" aria-disabled="true">
                      {entry.label}
                      <span className="nav-soon" aria-hidden="true">
                        {shell.soon}
                      </span>
                      <span className="sr-only">{shell.unavailable}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="shell-body">
          <header className="shell-top">
            {status}
            <div className="shell-user" aria-label={shell.userLabel}>
              <span className="avatar" aria-hidden="true">
                {email.slice(0, 1).toUpperCase()}
              </span>
              <span className="shell-user-text">
                <span className="shell-user-name">{email}</span>
                <span className="shell-user-role">{roleLabel}</span>
              </span>
            </div>
            <button
              type="button"
              className="btn"
              disabled={loggingOut}
              onClick={onLogout}
            >
              {shell.logout}
            </button>
          </header>
          <main id="main" className="shell-main" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
