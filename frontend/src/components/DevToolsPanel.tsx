import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { devResetSystem, devSwitchUser } from "../services/devToolsService";
import { getCurrentEmail, getCurrentRole, isDevEnvironment, logout } from "../services/authService";
import { resetLocalData } from "../services/rxdb";

const PRESET_USERS = [
  "admin-system@local.dev",
  "dev-superuser@local.dev",
  "campagne-manager.scenario1@local.dev",
  "intervenant-1.scenario1@local.dev",
  "intervenant-2.scenario1@local.dev",
  "analyste.scenario1@local.dev",
];

export function DevToolsPanel() {
  const navigate = useNavigate();
  const [selectedEmail, setSelectedEmail] = useState(PRESET_USERS[0]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isDevEnvironment()) {
    return null;
  }

  const currentRole = getCurrentRole();
  const currentEmail = getCurrentEmail();

  const onSwitch = async (target: string) => {
    setError(null);
    setMessage(null);
    try {
      await devSwitchUser(target);
      setMessage(`Session basculee vers ${target}`);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Bascule utilisateur refusee. Verifiez que l'environnement est en mode dev.");
    }
  };

  const onToggleSuperUser = async () => {
    if (currentRole === "developer_superuser") {
      const fallbackUser = localStorage.getItem("dev_previous_user") ?? "admin-system@local.dev";
      await onSwitch(fallbackUser);
      return;
    }

    if (currentEmail) {
      localStorage.setItem("dev_previous_user", currentEmail);
    }
    await onSwitch("dev-superuser@local.dev");
  };

  const onResetFrontend = async () => {
    setError(null);
    setMessage(null);
    try {
      await resetLocalData();
      logout();
      setMessage("Donnees frontend locales reinitialisees. Reconnexion requise.");
      navigate("/login", { replace: true });
    } catch {
      setError("Reinitialisation frontend echouee.");
    }
  };

  const onResetSystem = async () => {
    const confirmation = window.prompt("Tapez RESET pour confirmer la reinitialisation systeme.");
    if (confirmation !== "RESET") {
      return;
    }

    setError(null);
    setMessage(null);
    try {
      const result = await devResetSystem();
      setMessage(
        `Systeme reinitialise: users=${result.deleted_users}, zones=${result.deleted_health_areas}, campaigns=${result.deleted_campaigns}`,
      );
    } catch {
      setError("Reinitialisation systeme echouee.");
    }
  };

  return (
    <section className="dev-tools">
      <strong>Dev Tools</strong>
      <div className="dev-tools-row">
        <select value={selectedEmail} onChange={(e) => setSelectedEmail(e.target.value)}>
          {PRESET_USERS.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onSwitch(selectedEmail)}>Switch user</button>
        <button type="button" onClick={onToggleSuperUser}>
          {currentRole === "developer_superuser" ? "Disable super-user" : "Enable super-user"}
        </button>
        <button type="button" onClick={onResetFrontend}>Reset frontend data</button>
        <button type="button" onClick={onResetSystem}>Reset full system</button>
      </div>
      {message ? <p>{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
