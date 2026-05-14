import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { OfflineIndicator } from "../components/OfflineIndicator";
import { getMyAssignments } from "../services/assignmentService";
import { getCurrentRole } from "../services/authService";
import type { MyAssignment } from "../types/api";

export function DashboardPage() {
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const role = getCurrentRole();

  useEffect(() => {
    getMyAssignments()
      .then((rows) => setAssignments(rows))
      .catch(() => setAssignments([]));
  }, []);

  return (
    <main className="container">
      <div className="topline">
        <h1>Tableau de bord</h1>
        <OfflineIndicator />
      </div>
      <section className="card">
        <h2>Mes assignations</h2>
        {assignments.length > 0 ? (
          <ul>
            {assignments.slice(0, 5).map((assignment) => (
              <li key={assignment.id}>
                {assignment.campaign_name} - {assignment.health_area_name} ({assignment.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune assignation trouvee</p>
        )}
      </section>
      <div className="actions">
        {role === "intervenant_terrain" || role === "developer_superuser" ? <Link to="/data-collection" className="btn">Demarrer collecte</Link> : null}
        {role === "administrator_system" || role === "developer_superuser" ? <Link to="/admin/users" className="btn">Admin systeme</Link> : null}
        {role === "administrator_campaign" || role === "developer_superuser" ? <Link to="/admin/campaign" className="btn">Admin campagne</Link> : null}
        {role === "administrator_system" || role === "analyste" || role === "developer_superuser" ? (
          <Link to="/admin/analytics" className="btn">Analytics</Link>
        ) : null}
        {role === "administrator_system" || role === "developer_superuser" ? (
          <Link to="/admin/supervision" className="btn">Supervision</Link>
        ) : null}
      </div>
    </main>
  );
}
