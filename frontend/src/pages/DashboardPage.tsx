import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { OfflineIndicator } from "../components/OfflineIndicator";
import { getMyAssignment } from "../services/assignmentService";
import { getCurrentRole, logout } from "../services/authService";
import type { Assignment } from "../types/api";

export function DashboardPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const role = getCurrentRole();

  useEffect(() => {
    getMyAssignment()
      .then((res) => setAssignment(res.assignment))
      .catch(() => setAssignment(null));
  }, []);

  return (
    <main className="container">
      <div className="topline">
        <h1>Tableau de bord</h1>
        <OfflineIndicator />
      </div>
      <section className="card">
        <h2>Assignation courante</h2>
        {assignment ? (
          <ul>
            <li>Campagne: {assignment.campaign_id}</li>
            <li>Aire de sante: {assignment.health_area_id}</li>
            <li>Statut: {assignment.status}</li>
          </ul>
        ) : (
          <p>Aucune assignation trouvee</p>
        )}
      </section>
      <div className="actions">
        {role === "intervenant_terrain" || role === "developer_superuser" ? <Link to="/data-collection" className="btn">Demarrer collecte</Link> : null}
        {role === "intervenant_terrain" || role === "developer_superuser" ? <Link to="/sync-status" className="btn">Voir synchronisation</Link> : null}
        {role === "administrator_system" || role === "developer_superuser" ? <Link to="/admin/users" className="btn">Admin systeme</Link> : null}
        {role === "administrator_campaign" || role === "developer_superuser" ? <Link to="/admin/campaign" className="btn">Admin campagne</Link> : null}
        {role === "administrator_system" || role === "analyste" || role === "developer_superuser" ? (
          <Link to="/admin/analytics" className="btn">Analytics</Link>
        ) : null}
        <button
          type="button"
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
        >
          Se deconnecter
        </button>
      </div>
    </main>
  );
}
