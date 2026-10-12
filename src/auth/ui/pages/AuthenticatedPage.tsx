import { Navigate, useLocation } from "react-router";
import { bg } from "../assets/copy";
import { useAuthSession } from "../components/useAuthSession";

export function AuthenticatedPage() {
  const { identity, loggingOut, notice, logout } = useAuthSession();
  const location = useLocation();

  if (loggingOut) {
    return <p role="status">{bg.pending}</p>;
  }

  if (!identity) {
    return <Navigate replace to="/login" state={location.state} />;
  }

  return (
    <>
      <h1>{bg.authenticated}</h1>
      <p className="muted">{bg.authenticatedSub}</p>
      <p className="banner">{identity.email}</p>
      {notice && (
        <p role="alert" className="banner error">
          {notice}
        </p>
      )}
      <button className="btn" onClick={logout}>
        {bg.logout}
      </button>
    </>
  );
}
