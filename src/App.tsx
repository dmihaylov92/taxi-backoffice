import { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { AccountClient } from "./accounts/domain/clients/AccountClient";
import {
  AccountService,
  type AccountApi,
} from "./accounts/domain/services/AccountService";
import { AccountsPage } from "./accounts/ui/pages/AccountsPage";
import { homePath } from "./auth/domain/models/Identity";
import { ROLES, type Role } from "./common/domain/models/Role";
import { authService, type AuthApi } from "./auth/domain/services/AuthService";
import { isLinkPath } from "./auth/domain/services/ResetLinkService";
import { bg } from "./auth/ui/assets/copy";
import { AuthSessionProvider } from "./auth/ui/components/AuthSessionProvider";
import { useAuthSession } from "./auth/ui/components/useAuthSession";
import { AuthenticatedPage } from "./auth/ui/pages/AuthenticatedPage";
import { ForgotPasswordPage } from "./auth/ui/pages/ForgotPasswordPage";
import { LoginPage } from "./auth/ui/pages/LoginPage";
import { ResetPasswordPage } from "./auth/ui/pages/ResetPasswordPage";
import { ApiClient } from "./common/domain/clients/ApiClient";
import { roleLabels } from "./common/ui/assets/copy";
import { AppShell } from "./common/ui/components/AppShell";
import { Layout } from "./common/ui/components/Layout";

function roleLabel(roles: readonly Role[]): string {
  const primary = ROLES.find((role) => roles.includes(role));

  return primary ? roleLabels[primary] : "";
}

function PublicLayout({ sessionError }: { sessionError: boolean }) {
  return (
    <Layout>
      {sessionError && (
        <p className="banner error" role="alert">
          {bg.sessionUnconfirmed}
        </p>
      )}
      <Outlet />
    </Layout>
  );
}

function AccountsRoute({ accounts }: { accounts: AccountApi }) {
  const { identity, loggingOut, logout, expire } = useAuthSession();
  const location = useLocation();

  if (!identity) {
    return <Navigate replace to="/login" state={location.state} />;
  }

  if (!identity.roles.includes("ADMIN")) {
    return <Navigate replace to={homePath(identity)} />;
  }

  return (
    <AppShell
      email={identity.email}
      roleLabel={roleLabel(identity.roles)}
      loggingOut={loggingOut}
      onLogout={logout}
    >
      <AccountsPage
        accounts={accounts}
        currentUserId={identity.id}
        onSessionExpired={expire}
      />
    </AppShell>
  );
}

function AppRoutes({
  accounts,
  linkToken,
}: {
  accounts: AccountApi;
  linkToken?: string;
}) {
  const { booting, sessionError, identity } = useAuthSession();
  const [activeLink, setActiveLink] = useState(linkToken);
  const location = useLocation();
  const clearLink = () => setActiveLink(undefined);

  useEffect(() => {
    document.getElementById("main")?.focus();

    if (!isLinkPath(location.pathname)) {
      setActiveLink(undefined);
    }
  }, [location.pathname, booting]);

  if (booting) {
    return (
      <Layout>
        <p role="status">{bg.checkingSession}</p>
      </Layout>
    );
  }

  return (
    <Routes>
      <Route path="/accounts" element={<AccountsRoute accounts={accounts} />} />
      <Route element={<PublicLayout sessionError={sessionError} />}>
        <Route
          path="/login"
          element={
            identity ? (
              <Navigate replace to={homePath(identity)} />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/reset-password"
          element={
            <ResetPasswordPage
              mode="reset"
              token={activeLink}
              onConsumeLink={clearLink}
            />
          }
        />
        <Route
          path="/set-password"
          element={
            <ResetPasswordPage
              mode="set"
              token={activeLink}
              onConsumeLink={clearLink}
            />
          }
        />
        <Route path="/authenticated" element={<AuthenticatedPage />} />
        <Route
          path="*"
          element={<Navigate replace to="/login" state={location.state} />}
        />
      </Route>
    </Routes>
  );
}

/** Account requests renew the cookie session once through the same auth port before giving up on a 401. */
function createAccountService(auth: AuthApi): AccountApi {
  return new AccountService(
    new AccountClient(
      new ApiClient({ recover: async () => (await auth.renew?.()) ?? false }),
    ),
  );
}

export function App({
  auth = authService,
  accounts,
  linkToken,
}: {
  auth?: AuthApi;
  accounts?: AccountApi;
  linkToken?: string;
}) {
  const [defaultAccounts] = useState(() => createAccountService(auth));

  return (
    <AuthSessionProvider auth={auth}>
      <AppRoutes accounts={accounts ?? defaultAccounts} linkToken={linkToken} />
    </AuthSessionProvider>
  );
}
