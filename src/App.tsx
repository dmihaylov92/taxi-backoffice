import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { Field, Layout } from "./components/AuthUI";
import { bg, brand } from "./auth/copy";
import { type AuthPort, type Identity, pendingAuth } from "./auth/contract";
import { feedback, validate, type Mode } from "./auth/validation";

function BackLinks() {
  return (
    <div className="stack">
      <Link className="btn primary" to="/forgot-password">
        {bg.newLink}
      </Link>
      <Link className="btn" to="/login">
        {bg.back}
      </Link>
    </div>
  );
}
function AuthForm({
  mode,
  api,
  token,
  onLogin,
  notice,
}: {
  mode: Mode;
  api: AuthPort;
  token?: string;
  onLogin: (identity: Identity) => void;
  notice?: string;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState<{
    text: string;
    terminal: boolean;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const mounted = useRef(true);
  const form = useRef<HTMLFormElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const reset = mode === "reset" || mode === "set";
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (failure) summary.current?.focus();
  }, [failure]);
  useEffect(() => {
    if (done) heading.current?.focus();
  }, [done]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current || failure?.terminal) return;
    const found = validate(mode, email, password, confirm);
    setErrors(found);
    setFailure(null);
    if (Object.keys(found).length) {
      form.current
        ?.querySelector<HTMLInputElement>(`#${Object.keys(found)[0]}`)
        ?.focus();
      return;
    }
    if (!navigator.onLine) {
      setFailure({ text: bg.offline, terminal: false });
      return;
    }
    busy.current = true;
    setPending(true);
    try {
      if (mode === "login") {
        const identity = await api.login(email, password);
        if (mounted.current) onLogin(identity);
      } else if (mode === "forgot") await api.forgot(email);
      else await api.reset(token!, password);
      if (mounted.current) {
        setPassword("");
        setConfirm("");
        setDone(true);
      }
    } catch (error) {
      if (mounted.current) {
        setFailure(feedback(error, mode));
        setPassword("");
        setConfirm("");
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  const title = done
    ? mode === "forgot"
      ? bg.mailTitle
      : bg.saved
    : reset && !token
      ? bg.missing
      : bg[mode];
  const subtitle = done
    ? mode === "forgot"
      ? bg.mailSafe
      : bg.savedSub
    : reset && !token
      ? bg.missingSub
      : mode === "login"
        ? bg.loginSub
        : mode === "forgot"
          ? bg.forgotSub
          : bg.resetSub;
  useEffect(() => {
    document.title = `${title} · ${brand.name}`;
  }, [title]);
  return (
    <>
      <h1 ref={heading} tabIndex={-1}>
        {title}
      </h1>
      <p className="muted">{subtitle}</p>
      {done ? (
        <div className="stack">
          <p className="banner" role="status">
            {mode === "forgot" ? bg.expiry : bg.savedSub}
          </p>
          <Link className="btn primary" to="/login">
            {bg.back}
          </Link>
        </div>
      ) : reset && !token ? (
        <BackLinks />
      ) : (
        <>
          {mode === "login" && notice && (
            <p className="banner" role="status">
              {notice}
            </p>
          )}
          <form
            ref={form}
            className="stack"
            noValidate
            onSubmit={submit}
            aria-busy={pending}
          >
            {!reset && (
              <Field
                id="email"
                name="email"
                label={bg.email}
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                disabled={pending}
              />
            )}
            {mode !== "forgot" && (
              <Field
                id="password"
                name="password"
                label={bg.password}
                type="password"
                autoComplete={reset ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                hint={reset ? bg.policy : undefined}
                error={errors.password}
                disabled={pending || failure?.terminal}
              />
            )}
            {reset && (
              <Field
                id="confirm"
                name="confirm"
                label={bg.confirm}
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={errors.confirm}
                disabled={pending || failure?.terminal}
              />
            )}
            {failure && (
              <div
                ref={summary}
                className="banner error"
                role="alert"
                tabIndex={-1}
              >
                {failure.text}
              </div>
            )}
            <button
              className="btn primary"
              disabled={pending || failure?.terminal}
            >
              {pending ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  {bg.pending}
                </>
              ) : mode === "login" ? (
                bg.login
              ) : mode === "forgot" ? (
                bg.send
              ) : (
                bg.save
              )}
            </button>
            {mode === "login" ? (
              <Link className="text-link" to="/forgot-password">
                {bg.forgotLink}
              </Link>
            ) : (
              <Link className="btn" to="/login">
                {bg.back}
              </Link>
            )}
            {reset && failure?.terminal && (
              <Link className="btn" to="/forgot-password">
                {bg.newLink}
              </Link>
            )}
          </form>
          <div className="below hint">
            {mode === "login" ? (
              <>
                {bg.noRegistration}
                <p>{bg.singleSession}</p>
              </>
            ) : (
              bg.expiry
            )}
          </div>
        </>
      )}
    </>
  );
}
export function App({
  api = pendingAuth,
  linkToken,
}: {
  api?: AuthPort;
  linkToken?: string;
}) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState<string>();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    document.getElementById("main")?.focus();
  }, [location.pathname]);
  const onLogin = (user: Identity) => {
    setNotice(undefined);
    setLoggingOut(false);
    setIdentity(user);
    navigate("/authenticated", { replace: true });
  };
  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setIdentity(null);
    const confirmed = await api.logout().catch(() => false);
    setNotice(confirmed ? bg.signedOut : bg.localSignout);
    setLoggingOut(false);
    navigate("/login", { replace: true });
  }
  return (
    <Layout>
      <Routes>
        {(["login", "forgot", "reset", "set"] as const).map((mode) => (
          <Route
            key={mode}
            path={mode === "login" ? "/login" : `/${mode}-password`}
            element={
              <AuthForm
                key={mode}
                mode={mode}
                api={api}
                token={linkToken}
                onLogin={onLogin}
                notice={notice}
              />
            }
          />
        ))}
        <Route
          path="/authenticated"
          element={
            loggingOut ? (
              <p role="status">{bg.pending}</p>
            ) : identity ? (
              <>
                <h1>{bg.authenticated}</h1>
                <p className="muted">{bg.authenticatedSub}</p>
                <p className="banner">{identity.email}</p>
                <button className="btn" onClick={logout}>
                  {bg.logout}
                </button>
              </>
            ) : (
              <Navigate replace to="/login" state={location.state} />
            )
          }
        />
        <Route
          path="*"
          element={<Navigate replace to="/login" state={location.state} />}
        />
      </Routes>
    </Layout>
  );
}
