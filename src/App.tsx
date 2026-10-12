import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { Layout } from "./common/ui/components/Layout";
import { authService, type AuthApi } from "./auth/domain/services/AuthService";
import { isLinkPath } from "./auth/domain/services/ResetLinkService";
import { bg } from "./auth/ui/assets/copy";
import { AuthSessionProvider } from "./auth/ui/components/AuthSessionProvider";
import { useAuthSession } from "./auth/ui/components/useAuthSession";
import { AuthenticatedPage } from "./auth/ui/pages/AuthenticatedPage";
import { ForgotPasswordPage } from "./auth/ui/pages/ForgotPasswordPage";
import { LoginPage } from "./auth/ui/pages/LoginPage";
import { ResetPasswordPage } from "./auth/ui/pages/ResetPasswordPage";

function AppRoutes({ linkToken }: { linkToken?: string }) {
  const { booting, sessionError, identity } = useAuthSession();
  const [activeLink, setActiveLink] = useState(linkToken);
  const location = useLocation();
  const clearLink = () => setActiveLink(undefined);

  useEffect(() => {
    document.getElementById("main")?.focus();

    if (!isLinkPath(location.pathname)) {
      setActiveLink(undefined);
    }
  }, [location.pathname]);

  if (booting) {
    return <p role="status">{bg.checkingSession}</p>;
  }

  return (
    <>
      {sessionError && (
        <p className="banner error" role="alert">
          {bg.sessionUnconfirmed}
        </p>
      )}
      <Routes>
        <Route
          path="/login"
          element={
            identity ? <Navigate replace to="/authenticated" /> : <LoginPage />
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
      </Routes>
    </>
  );
}

export function App({
  auth = authService,
  linkToken,
}: {
  auth?: AuthApi;
  linkToken?: string;
}) {
  return (
    <AuthSessionProvider auth={auth}>
      <Layout>
        <AppRoutes linkToken={linkToken} />
      </Layout>
    </AuthSessionProvider>
  );
}
