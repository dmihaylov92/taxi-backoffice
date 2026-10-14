import { useEffect, useState, type ReactElement } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import type { AccountApi } from "./accounts/domain/services/AccountService";
import { AccountsPage } from "./accounts/ui/pages/AccountsPage";
import { homePath, type Identity } from "./auth/domain/models/Identity";
import { isLinkPath } from "./auth/domain/services/ResetLinkService";
import { bg } from "./auth/ui/assets/copy";
import { useAuthSession } from "./auth/ui/components/useAuthSession";
import { AuthenticatedPage } from "./auth/ui/pages/AuthenticatedPage";
import { ForgotPasswordPage } from "./auth/ui/pages/ForgotPasswordPage";
import { LoginPage } from "./auth/ui/pages/LoginPage";
import { ResetPasswordPage } from "./auth/ui/pages/ResetPasswordPage";
import {
  APP_MODULES,
  type RoutedModuleId,
} from "./common/domain/models/AppModule";
import { ROLES, type Role } from "./common/domain/models/Role";
import {
  canOpenModule,
  visibleModules,
} from "./common/domain/services/AccessService";
import { roleLabels, shell } from "./common/ui/assets/copy";
import { AppShell, type NavItem } from "./common/ui/components/AppShell";
import { Layout } from "./common/ui/components/Layout";
import type { CarApi } from "./rides/domain/services/CarService";
import type { RideApi } from "./rides/domain/services/RideService";
import { CarsPage } from "./rides/ui/pages/CarsPage";
import { RidesPage } from "./rides/ui/pages/RidesPage";

export interface AppServices {
  accounts: AccountApi;
  cars: CarApi;
  rides: RideApi;
}

interface PageContext {
  identity: Identity;
  services: AppServices;
  /** Ends the session UI after an API call reports it expired. */
  expire: () => void;
}

/**
 * The screens, one per routed module. Each module's path and who may open it come from
 * `APP_MODULES`; a new module is declared there and given its page here.
 */
const PAGES: Record<RoutedModuleId, (context: PageContext) => ReactElement> = {
  accounts: ({ identity, services, expire }) => (
    <AccountsPage
      accounts={services.accounts}
      currentUserId={identity.id}
      onSessionExpired={expire}
    />
  ),
  cars: ({ services, expire }) => (
    <CarsPage cars={services.cars} onSessionExpired={expire} />
  ),
  rides: ({ identity, services, expire }) => (
    <RidesPage
      rides={services.rides}
      currentUserId={identity.id}
      onSessionExpired={expire}
    />
  ),
};

/** Keys of `PAGES`, which `Object.keys` types as plain strings. */
const ROUTED_IDS = Object.keys(PAGES) as RoutedModuleId[];

function roleLabel(roles: readonly Role[]): string {
  const primary = ROLES.find((role) => roles.includes(role));

  return primary ? roleLabels[primary] : "";
}

/** Only the modules the account may open; the rest are not shown at all. */
function navItems(roles: readonly Role[]): NavItem[] {
  return visibleModules(roles).map((module) => ({
    label: shell.items[module.id],
    to: module.path,
  }));
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

/**
 * A module's screen, inside the application shell, for a signed-in account allowed to open it;
 * everyone else is redirected. Roles are not implied: an administrator reaches dispatching only
 * through DISPATCHER. This is a UX guard; the API enforces the same rules.
 */
function ModuleRoute({
  id,
  services,
}: {
  id: RoutedModuleId;
  services: AppServices;
}) {
  const { identity, loggingOut, logout, expire } = useAuthSession();
  const location = useLocation();

  if (!identity) {
    return <Navigate replace to="/login" state={location.state} />;
  }

  if (!canOpenModule(identity.roles, id)) {
    return <Navigate replace to={homePath(identity)} />;
  }

  return (
    <AppShell
      email={identity.email}
      roleLabel={roleLabel(identity.roles)}
      loggingOut={loggingOut}
      onLogout={logout}
      items={navItems(identity.roles)}
    >
      {PAGES[id]({ identity, services, expire })}
    </AppShell>
  );
}

/** Every application route: module screens guarded by `APP_MODULES`, then the public pages. */
export function AppRoutes({
  services,
  linkToken,
}: {
  services: AppServices;
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
      {ROUTED_IDS.map((id) => (
        <Route
          key={id}
          path={APP_MODULES[id].path}
          element={<ModuleRoute id={id} services={services} />}
        />
      ))}
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
