import { getCurrentEmail, getCurrentRole, isDevEnvironment } from "../services/authService";

export function SessionIndicator() {
  const email = getCurrentEmail() ?? "unknown";
  const role = getCurrentRole() ?? "unknown";
  const envLabel = import.meta.env.VITE_APP_ENV ?? "dev";

  return (
    <div className="session-indicator">
      <span className="session-pill">env: {envLabel}</span>
      <span className="session-pill">user: {email}</span>
      <span className="session-pill">role: {role}</span>
      {isDevEnvironment() && role === "developer_superuser" ? (
        <span className="session-pill super">super-user active</span>
      ) : null}
    </div>
  );
}
