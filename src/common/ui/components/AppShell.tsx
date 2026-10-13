import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { brand, common, shell } from "../assets/copy";

interface AppShellProps {
  email: string;
  roleLabel: string;
  loggingOut: boolean;
  onLogout: () => void;
  children: ReactNode;
}

interface NavEntry {
  label: string;
  /** Only modules that exist are links; the rest stay visibly unavailable rather than pretending. */
  to?: string;
}

const NAV_ENTRIES: readonly NavEntry[] = [
  { label: shell.items.home },
  { label: shell.items.orders },
  { label: shell.items.drivers },
  { label: shell.items.customers },
  { label: shell.items.cars, to: "/cars" },
  { label: shell.items.accounts, to: "/accounts" },
  { label: shell.items.settings },
];

export function AppShell({
  email,
  roleLabel,
  loggingOut,
  onLogout,
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
              {NAV_ENTRIES.map((entry) => (
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
