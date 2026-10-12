import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router";
import { brand } from "../../../common/ui/assets/copy";
import type { AuthMode } from "../../domain/models/AuthMode";
import { bg } from "../assets/copy";
import { BackLinks } from "./BackLinks";

interface Props {
  mode: AuthMode;
  done: boolean;
  missingLink?: boolean;
  children: ReactNode;
}

function titleFor(mode: AuthMode, done: boolean, missingLink: boolean): string {
  if (done) {
    return mode === "forgot" ? bg.mailTitle : bg.saved;
  }

  if (missingLink) {
    return bg.missing;
  }

  return bg[mode];
}

function subtitleFor(
  mode: AuthMode,
  done: boolean,
  missingLink: boolean,
): string {
  if (done) {
    return mode === "forgot" ? bg.mailSafe : bg.savedSub;
  }

  if (missingLink) {
    return bg.missingSub;
  }

  switch (mode) {
    case "login": {
      return bg.loginSub;
    }

    case "forgot": {
      return bg.forgotSub;
    }

    default: {
      return bg.resetSub;
    }
  }
}

export function AuthFormShell({
  mode,
  done,
  missingLink = false,
  children,
}: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const title = titleFor(mode, done, missingLink);
  const showsForm = !done && !missingLink;

  useEffect(() => {
    if (done) {
      heading.current?.focus();
    }
  }, [done]);

  useEffect(() => {
    document.title = `${title} · ${brand.name}`;
  }, [title]);

  return (
    <>
      <h1 ref={heading} tabIndex={-1}>
        {mode === "login" && !done ? bg.welcome : title}
      </h1>
      <p className="muted">{subtitleFor(mode, done, missingLink)}</p>
      {done && (
        <div className="stack">
          {mode === "forgot" && (
            <p className="banner" role="status">
              {bg.expiry}
            </p>
          )}
          <Link className="btn primary" to="/login">
            {bg.back}
          </Link>
        </div>
      )}
      {missingLink && !done && <BackLinks />}
      {showsForm && (
        <>
          {children}
          {mode !== "login" && <div className="below hint">{bg.expiry}</div>}
        </>
      )}
    </>
  );
}
