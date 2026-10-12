import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import type { Identity } from "../../domain/models/Identity";
import type { AuthApi } from "../../domain/services/AuthService";
import { bg } from "../assets/copy";
import { AuthSessionContext } from "./useAuthSession";

const CHANNEL_NAME = "taxi-auth";
const LOGOUT_MESSAGE = "logout";

export function AuthSessionProvider({
  auth,
  children,
}: {
  auth: AuthApi;
  children: ReactNode;
}) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [booting, setBooting] = useState(Boolean(auth.session));
  const [sessionError, setSessionError] = useState(false);
  const channel = useRef<BroadcastChannel | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    auth
      .session?.()
      .then((user) => {
        if (active) {
          setIdentity(user);
        }
      })
      .catch(() => {
        if (active) {
          setSessionError(true);
        }
      })
      .finally(() => {
        if (active) {
          setBooting(false);
        }
      });

    const opened =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(CHANNEL_NAME);

    channel.current = opened;

    if (opened) {
      opened.onmessage = (event) => {
        if (event.data === LOGOUT_MESSAGE) {
          setIdentity(null);
          setNotice(bg.session);
        }
      };
    }

    return () => {
      active = false;
      opened?.close();
    };
  }, [auth]);

  function signIn(user: Identity) {
    setSessionError(false);
    setNotice(undefined);
    setLoggingOut(false);
    setIdentity(user);
    navigate("/authenticated", { replace: true });
  }

  async function logout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    const confirmed = await auth.logout().catch(() => false);

    if (!confirmed) {
      setNotice(bg.localSignout);
      setLoggingOut(false);

      return;
    }

    setIdentity(null);
    channel.current?.postMessage(LOGOUT_MESSAGE);
    setNotice(bg.signedOut);
    setLoggingOut(false);
    navigate("/login", { replace: true });
  }

  return (
    <AuthSessionContext.Provider
      value={{
        auth,
        identity,
        booting,
        sessionError,
        loggingOut,
        notice,
        signIn,
        logout,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}
