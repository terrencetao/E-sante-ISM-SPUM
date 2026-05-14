import { Link, useNavigate } from "react-router-dom";

import { getCurrentRole, logout } from "../services/authService";

export function AppShell({ children }: { children: JSX.Element }) {
  const role = getCurrentRole();
  const navigate = useNavigate();

  return (
    <div>
      <header className="app-shell-header">
        <div className="app-shell-brand">e-Sante ISM-SPUM</div>
        <nav className="app-shell-nav">
          <Link to="/dashboard" className="btn secondary">Accueil</Link>
          {role === "administrator_system" || role === "analyste" || role === "developer_superuser" ? (
            <Link to="/admin/analytics" className="btn secondary">Analytics</Link>
          ) : null}
          {role === "administrator_system" || role === "developer_superuser" ? (
            <Link to="/admin/supervision" className="btn secondary">Supervision</Link>
          ) : null}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            Logout
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
