import type { ReactNode } from "react";
import { brand, common } from "../assets/copy";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip" href="#main">
        {common.skip}
      </a>
      <div className="auth">
        <main id="main" tabIndex={-1}>
          <section className="auth-card">
            <div className="brand">
              <span className="checker" aria-hidden="true" />
              {brand.name}
            </div>
            {children}
          </section>
        </main>
      </div>
    </>
  );
}
