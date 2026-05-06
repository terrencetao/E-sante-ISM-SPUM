import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { OfflineIndicator } from "../components/OfflineIndicator";
import { getMyAssignment } from "../services/assignmentService";
import type { Assignment } from "../types/api";

export function DashboardPage() {
  const [assignment, setAssignment] = useState<Assignment | null>(null);

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
        <Link to="/data-collection" className="btn">Demarrer collecte</Link>
        <Link to="/sync-status" className="btn">Voir synchronisation</Link>
      </div>
    </main>
  );
}
